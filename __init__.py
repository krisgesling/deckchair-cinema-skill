from adapt.intent import IntentBuilder
from lxml import html
from mycroft import MycroftSkill, intent_file_handler, intent_handler
from mycroft.skills.context import adds_context, removes_context
from mycroft.util.log import LOG
from mycroft.util.format import nice_date, nice_time
from mycroft.util.parse import extract_datetime
import requests, datetime

__author__ = 'krisgesling'
LOGGER = LOG(__name__)

# TODO fix intent clashes / testing problems...
# TODO add new scrape for movie blurb

class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)
        self.__movieDict = {}

    @intent_file_handler('cinema.deckchair.intent')
    def handle_cinema_deckchair(self, message):
        try:
            # 1. Extract date, or default to today
            # Get a date from requests like "what's on at deckchair tomorrow"
            when = extract_datetime(
                message.data.get('utterance'), lang=self.lang)[0]

            # 2. Scrape website for movie on this date
            webpage = requests.get('http://www.deckchaircinema.com/program/')
            dataTree = html.fromstring(webpage.content)
            # Get list of table rows from program
            # - these alternate between date and movie[s]
            trList = dataTree.xpath('//table[@id="program"]/tbody/tr')
            # Find child with provided date in format "Monday 22 October"
            dateRow = next(iter([ x for x in trList
                if x.getchildren()[0].text==when.strftime("%A %-d %B")
            ]), None)

            # 3. Test if date is in deckchair program range
            firstDate = self.__getFirstDate(trList)
            lastDate = self.__getLastDate(trList)
            # TODO add timezone info to first and last date instead of remove from when
            isDateInRange = firstDate <= when.replace(tzinfo=None) <= lastDate

            if isDateInRange:
                # 4. Add all film rows that follow a date row to a list
                moviesOnDate = self.__addMovieFromDate(dateRow, moviesOnDate=[])
                # 5. Construct message to return
                movieDetailsDialog = ""
                for movie in moviesOnDate:
                    if len(movieDetailsDialog)>0:
                        movieDetailsDialog+=", and "
                    # Movie title
                    movieTitle = movie.getchildren()[0].getchildren()[0].text
                    # Movie time
                    movieTime = when.replace(
                        hour=int(movie.getchildren()[1].text[0:-5]),
                        minute=int(movie.getchildren()[1].text[-4:-2])
                        )
                    movieDetailsDialog+=movieTitle+", at "+nice_time(movieTime)

                self.speak_dialog('cinema.deckchair', {
                    'when': nice_date(when, now=datetime.datetime.now()),
                    'movieDetails': movieDetailsDialog
                    })

                # 6. Setup context and data for follow up questions
                contextStr = ""
                for movie in moviesOnDate:
                    movieDetails = self.__fetchMovieDetails(movie)
                    # LOG.info(movieDetails)
                    self.__addMovieDetailsToDict(movie)
                    # if multiple movies, concatenate with unique delimiter
                    if len(contextStr)>0:
                        contextStr+="~~:and:~~"
                    contextStr+=movie.getchildren()[0].getchildren()[0].text
                self.set_context('MovieTitle', contextStr)

            else:
                self.speak_dialog('error.daterange', {
                    'when': nice_date(when, now=datetime.datetime.now()),
                    'firstDate': nice_date(firstDate, now=datetime.datetime.now()),
                    'lastDate': nice_date(lastDate, now=datetime.datetime.now())
                    })

        except ( requests.exceptions.ConnectionError
            or requests.exceptions.HTTPError
            or requests.exceptions.Timeout
            or requests.exceptions.TooManyRedirects
            ) as e:
            LOG.error("Error: {0}".format(e))
            self.speak_dialog('error.http')
        except Exception as e:
            LOG.error("Error: {0}".format(e))
            self.speak_dialog('error')

    @intent_handler(IntentBuilder('MovieRatingIntent')
        .require('MovieTitle')
        .require('rating')
        .build())
    def handle_movie_rating(self, message):
        self.__handleMovieDetailsResponse(message, 'rating')

    @intent_handler(IntentBuilder('MovieLengthIntent')
        .require('MovieTitle')
        .require('length')
        .build())
    def handle_movie_length(self, message):
        self.__handleMovieDetailsResponse(message, 'length')

    def stop(self):
        pass

    def __addMovieFromDate(self, row, moviesOnDate=[]):
        if row.getnext().getchildren()[0].get("class") == "program-film":
            moviesOnDate.append(row.getnext())
            return self.__addMovieFromDate(row.getnext(), moviesOnDate)
        else:
            return moviesOnDate

    def __addMovieDetailsToDict(self, movie):
        # TODO Separate getting details from assigning to dict
        movieTitle = movie.getchildren()[0].getchildren()[0].text
        self.__movieDict[movieTitle] = {
            'length': self.__convertLengthStr(movie.getchildren()[2].text[0:-1]),
            'rating': movie.getchildren()[3].text,
            'screeningLocation': movie.getchildren()[4].text,
            # Additional options in [5].getchildren() are:
                # [film details via linked page,
                #  youtube trailer link,
                #  buy tickets link,
                #  ical calendar item link]
        }

    def __convertLengthStr(self, string):
        # TODO Fix instance of 1 hour.
        # Convert movie length from "122m" to "2 hours and 2 minutes"
        lengthInMinutes = string
        lengthForSpeaking = str(int(int(lengthInMinutes) / 60)) + " hours"
        if (int(lengthInMinutes) % 60 > 0):
            lengthForSpeaking += " and " + str(int(lengthInMinutes) % 60) + " minutes"
        return lengthForSpeaking

    def __fetchMovieDetails(self, movie):
        # Fetch extra movie data from dedicated webpage
        moviePage = requests.get(movie.getchildren()[5].getchildren()[0].get('href'))
        movieData = html.fromstring(moviePage.content)
        synopsisEl = movieData.xpath('//div[@id="main_content"]/div[@class="container"]/div[@class="row"]/div[@class="span8"]/div[@class="content"]/p')
        # Sometimes they put a span tag around the synopsis text...
        synopsis = synopsisEl[0].text if synopsisEl[0].text else synopsisEl[0].getchildren()[0].text
        # rightPanel = movieData.xpath('//div[@id="main_content"]/div[@class="container"]/div[@class="row"]/div[@class="span4"]')
        # LOG.info(len(rightPanel))
        # directorRow = next(iter([ x for x in rightPanel
        #     if x.text=="Director"
        # ]), None)
        # LOG.info(directorRow)
        movieDetails = {
            # First details from program page
            'title': movie.getchildren()[0].getchildren()[0].text,
            'length': self.__convertLengthStr(movie.getchildren()[2].text[0:-1]),
            'rating': movie.getchildren()[3].text,
            'screeningLocation': movie.getchildren()[4].text,
            # Remaining from movieData
            'synopsis': synopsis,
        }
        return movieDetails

    def __getDateFromStr(self, string):
        year = str(datetime.datetime.now().year)
        return datetime.datetime.strptime(string+" "+year, "%A %d %B %Y")

    def __getFirstDate(self, trList):
        # Recursive function to return first date row of program
        def getFirstDateRow(row):
            if row.getchildren()[0].get("class") == "program-date":
                return row.getchildren()[0].text
            else:
                return getFirstDateRow(row.getnext())
        dateText = getFirstDateRow(trList[0])
        return self.__getDateFromStr(dateText)

    def __getLastDate(self, trList):
        # Recursive function to return last date row of program
        def getLastDateRow(row):
            if row.getchildren()[0].get("class") == "program-date":
                return row.getchildren()[0].text
            else:
                return getLastDateRow(row.getprevious())
        dateText = getLastDateRow(trList[len(trList)-1])
        return self.__getDateFromStr(dateText)

    def __handleMovieDetailsResponse(self, message, detail):
        movieTitle = message.data.get('MovieTitle')
        if "~~:and:~~" in movieTitle:
            movieTitles = movieTitle.split("~~:and:~~")
        else:
            movieTitles = [movieTitle]
        for title in movieTitles:
            self.speak_dialog('movie.'+detail, {
                'title': title,
                detail: self.__movieDict[title][detail],
                })

def create_skill():
    return DeckchairCinema()

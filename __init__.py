from adapt.intent import IntentBuilder
from lxml import html
from mycroft import MycroftSkill, intent_file_handler, intent_handler
from mycroft.skills.context import adds_context, removes_context
from mycroft.util.log import LOG
from mycroft.util.format import nice_date, nice_time
from mycroft.util.parse import extract_datetime, extract_number, match_one
import requests, datetime

__author__ = 'krisgesling'
LOGGER = LOG(__name__)

# TODO handle which movie?

class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)
        self.__currentContextTitles = []
        self.__movieDict = {}
        self.__previousRequest = ''

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

                # 6. Fetch data and set context for follow up questions
                self.__currentContextTitles = []
                for movie in moviesOnDate:
                    movieDetails = self.__fetchMovieDetails(movie)
                    self.__movieDict[movieDetails['title']] = movieDetails
                    # Add titles to list, rather than concat into context str
                    self.__currentContextTitles.append(
                        movie.getchildren()[0].getchildren()[0].text
                    )
                self.set_context('MovieTitle', '~~True~~')

            else:
                # If date is not in the range of the current film program
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

    """ Handle all follow up questions
        Each intent_handler requires:
        - MovieTitle (string): the context string
        - detail (vocab): detected speech located in vocab/en-us/*.voc
    """

    @intent_handler(IntentBuilder('MovieRatingIntent')
        .require('MovieTitle').require('rating').build())
    def handle_movie_rating(self, message):
        self.__handleMovieDetailsResponse(message, 'rating')

    @intent_handler(IntentBuilder('MovieLengthIntent')
        .require('MovieTitle').require('length').build())
    def handle_movie_length(self, message):
        self.__handleMovieDetailsResponse(message, 'length')

    @intent_handler(IntentBuilder('MovieDirectorIntent')
        .require('MovieTitle').require('director').build())
    def handle_movie_director(self, message):
        self.__handleMovieDetailsResponse(message, 'director')

    @intent_handler(IntentBuilder('MovieSynopsisIntent')
        .require('MovieTitle').require('synopsis').build())
    def handle_movie_synopsis(self, message):
        self.__handleMovieDetailsResponse(message, 'synopsis')

    @intent_handler(IntentBuilder('MovieYearIntent')
        .require('MovieTitle').require('year').build())
    def handle_movie_year(self, message):
        self.__handleMovieDetailsResponse(message, 'year')

    @intent_handler(IntentBuilder('MovieCountryIntent')
        .require('MovieTitle').require('country').build())
    def handle_movie_country(self, message):
        self.__handleMovieDetailsResponse(message, 'country')

    @intent_handler(IntentBuilder('MovieLanguageIntent')
        .require('MovieTitle').require('language').build())
    def handle_movie_language(self, message):
        self.__handleMovieDetailsResponse(message, 'language')

    def __handleMovieDetailsResponse(self, message, detail):
        """ Common function for follow up intent_handlers
            Args:
            - message (object): incoming from messagebus
            - detail (string): type of detail requested [country, rating, etc]
        """
        movieTitle = message.data.get('MovieTitle')
        if len(self.__currentContextTitles) > 1 and movieTitle == '~~True~~':
            whichMovieDialog = 'Which movie did you mean, '
            joinStr = ', or, '
            for title in self.__currentContextTitles:
                whichMovieDialog+=title+joinStr
            whichMovieDialog = whichMovieDialog[:-len(joinStr)]+'?'

            def validator(utterance):
                # test utterance against titles on current day
                # TODO add extract_number to catch "first one" etc
                return match_one(utterance,
                    self.__currentContextTitles)[1] > 0.5
            def on_fail(utterance):
                return "Sorry I didn't catch that. "+whichMovieDialog
            userResponse = self.get_response(
                dialog=whichMovieDialog,
                validator=validator,
                num_retries=2,
                on_fail=on_fail
                )
            selectedMovie = match_one(userResponse,
                self.__currentContextTitles)[0]
            title = selectedMovie
            # Set it as context to create default for future questions
            # Leave __currentContextTitles to enable user to switch.
            self.set_context('MovieTitle', selectedMovie)
        else:
            # if context explicitly set by get_response, use that
            # else there should only be one title in __currentContextTitles
            title = (movieTitle if self.__movieDict[movieTitle]
                     else self.__currentContextTitles[0])

        return self.speak_dialog('movie.'+detail, {
            'title': title,
            detail: self.__movieDict[title][detail],
            })

    def stop(self):
        pass

    def __addMovieFromDate(self, row, moviesOnDate=[]):
        if row.getnext().getchildren()[0].get("class") == "program-film":
            moviesOnDate.append(row.getnext())
            return self.__addMovieFromDate(row.getnext(), moviesOnDate)
        else:
            return moviesOnDate

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
        moviePage = requests.get(
            movie.getchildren()[5].getchildren()[0].get('href'))
        movieData = html.fromstring(moviePage.content)
        synopsisEl = movieData.xpath(
            '//div[@id="main_content"]/div[@class="container"]'
            +'/div[@class="row"]/div[@class="span8"]'
            +'/div[@class="content"]/p')
        # Sometimes they put a span tag around the synopsis text...
        synopsis = (
            synopsisEl[0].text if synopsisEl[0].text
            else synopsisEl[0].getchildren()[0].text)
        # Remaining details in relatively consistent locations on right side.
        rightPanel = movieData.xpath(
            '//div[@id="main_content"]/div[@class="container"]'
            +'/div[@class="row"]/div[@class="span4"]')[0]
        def getInfo(info):
            # Find element containing info as heading, then return next element
            heading = next(iter([ x for x in rightPanel
                if x.text==info
            ]), None)
            return (heading.getnext().text if heading.getnext().text
                else heading.getnext().getchildren().text)

        # Construct return object
        movieDetails = {
            # First details from program page
            'title': movie.getchildren()[0].getchildren()[0].text,
            'length': self.__convertLengthStr(movie.getchildren()[2].text[0:-1]),
            'rating': movie.getchildren()[3].text,
            'screeningLocation': movie.getchildren()[4].text,
            # Remaining from movieData
            'synopsis': synopsis,
            'director': getInfo('Director'),
            'year': getInfo('Year'),
            'country': getInfo('Country of Origin'),
            'language': getInfo('Language'),
            # TODO when else is this movie showing? / Is this showing again?
            # Could compare 'showtimes' to current date and see if a future
            # showing is taking place...
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


def create_skill():
    return DeckchairCinema()

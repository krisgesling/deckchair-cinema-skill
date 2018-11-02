from adapt.intent import IntentBuilder
from lxml import html
from mycroft import MycroftSkill, intent_file_handler
from mycroft.util.log import LOG
from mycroft.util.format import nice_date, nice_time
from mycroft.util.parse import extract_datetime
import requests, datetime

__author__ = 'krisgesling'
LOGGER = LOG(__name__)

# TODO translate movie times using nice_time
# TODO add context to allow user to then ask about film details

class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)

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
            # Get list of table rows from program - these alternate between date and movie[s]
            trList = dataTree.xpath('//table[@id="program"]/tbody/tr')
            # Find child with provided date in format "Monday 22 October"
            dateRow = next(iter([
                x for x in trList
                if x.getchildren()[0].text==when.strftime("%A %-d %B")
            ]), None)

            # 3. Test if date is in deckchair program range
            firstDate = self.__getFirstDate(trList)
            lastDate = self.__getLastDate(trList)
            # TODO add timezone info to first and last date instead of remove from when
            isDateInRange = firstDate <= when.replace(tzinfo=None) <= lastDate

            if isDateInRange:
                # 4. Add all film rows that follow a date row to a list
                moviesOnDate = self.__addMovieFromDate(dateRow)
                # 5. Construct message to return
                movieDetails = ""
                for movie in moviesOnDate:
                    if len(movieDetails)>0:
                        movieDetails+=", and "
                    # Movie title
                    movieDetails+=movie.getchildren()[0].getchildren()[0].text
                    movieDetails+=", at "
                    # Movie time
                    movieTime = when.replace(
                        hour=int(movie.getchildren()[1].text[0:-5]),
                        minute=int(movie.getchildren()[1].text[-4:-2])
                        )
                    movieDetails+=nice_time(movieTime)

                    ### OTHER DETAILS AVAILABLE ON SCRAPED PAGE ###
                    # Length of film = movie.getchildren()[2].text
                    # Film age rating = movie.getchildren()[3].text
                    # Film location [deckchair or other cinema] = movie.getchildren()[4].text
                    # Additional options in [5].getchildren() are:
                        # [film details via linked page,
                        #  youtube trailer link,
                        #  buy tickets link,
                        #  ical calendar item link]
                self.speak_dialog('cinema.deckchair', {
                    'when': nice_date(when, now=datetime.datetime.now()),
                    'movieDetails': movieDetails
                    })
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

    def stop(self):
        pass

    def __addMovieFromDate(self, row, moviesOnDate=[]):
        if row.getnext().getchildren()[0].get("class") == "program-film":
            moviesOnDate.append(row.getnext())
            return self.__addMovieFromDate(row.getnext(), moviesOnDate)
        else:
            return moviesOnDate

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

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

# TODO Add caching of program to reduce fetching on multiple queries

class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)
        self._activeTitle = ''
        self._currentContextTitles = []
        self._movieDict = {}
        self._previousRequest = ''

    @intent_file_handler('whats.on.intent')
    def handle_cinema_deckchair(self, message):
        try:
            # 1. Extract date, or default to today
            # Get a date from requests like "what's on at deckchair tomorrow"
            when = extract_datetime(
                message.data.get('utterance'), lang=self.lang)[0]
            when = datetime.datetime.strptime(
                "Saturday 17 November 2018", "%A %d %B %Y")
            # 2. Scrape website for movie on this date
            # webpage = requests.get('http://www.deckchaircinema.com/program/')
            webpage = requests.get('https://krisgesling.github.io/deckchair-cinema-skill/')
            dataTree = html.fromstring(webpage.content)
            # Get list of table rows from program
            # - these alternate between date and movie[s]
            # TODO would this be better just fetching the whole tbody
            # as one element? Can then utilise E.find()
            # rather than next(iter([x for in if ]))
            trList = dataTree.xpath('//table[@id="program"]/tbody/tr')
            # Find child with provided date in format "Monday 22 October"
            dateRow = next(( x for x in trList
                if x.getchildren()[0].text==when.strftime("%A %-d %B")))
            # 3. Test if date is in deckchair program range
            firstDate = self._getFirstDate(trList)
            lastDate = self._getLastDate(trList)
            # TODO add timezone info to first and last date instead of remove from when
            isDateInRange = firstDate <= when.replace(tzinfo=None) <= lastDate

            if isDateInRange:
                # 4. Add all film rows that follow a date row to a list
                moviesOnDate = self._addMovieFromDate(dateRow, moviesOnDate=[])
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

                self.speak_dialog('whats.on', {
                    'when': nice_date(when, now=datetime.datetime.now()),
                    'movieDetails': movieDetailsDialog
                    })

                # 6. Fetch data and set context for follow up questions
                # Reset data from previous requests.
                self._currentContextTitles = []
                self._activeTitle = ''
                for movie in moviesOnDate:
                    movieDetails = self._fetchMovieDetails(movie)
                    self._movieDict[movieDetails['title']] = movieDetails
                    # Add titles to list, rather than concat into context str
                    self._currentContextTitles.append(
                        movie.getchildren()[0].getchildren()[0].text
                    )
                self.set_context('MovieTitle', '~~True~~')

            else:
                # If date is not in the range of the current film program
                nowDate = datetime.datetime.now()
                self.speak_dialog('error.daterange', {
                    'when': nice_date(when, nowDate),
                    'firstDate': nice_date(firstDate, nowDate),
                    'lastDate': nice_date(lastDate, nowDate)
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
        self._handleMovieDetailsResponse(message, 'rating')

    @intent_handler(IntentBuilder('MovieLengthIntent')
        .require('MovieTitle').require('length').build())
    def handle_movie_length(self, message):
        self._handleMovieDetailsResponse(message, 'length')

    @intent_handler(IntentBuilder('MovieDirectorIntent')
        .require('MovieTitle').require('director').build())
    def handle_movie_director(self, message):
        self._handleMovieDetailsResponse(message, 'director')

    @intent_handler(IntentBuilder('MovieSynopsisIntent')
        .require('MovieTitle').require('synopsis').build())
    def handle_movie_synopsis(self, message):
        self._handleMovieDetailsResponse(message, 'synopsis')

    @intent_handler(IntentBuilder('MovieYearIntent')
        .require('MovieTitle').require('year').build())
    def handle_movie_year(self, message):
        self._handleMovieDetailsResponse(message, 'year')

    @intent_handler(IntentBuilder('MovieCountryIntent')
        .require('MovieTitle').require('country').build())
    def handle_movie_country(self, message):
        self._handleMovieDetailsResponse(message, 'country')

    @intent_handler(IntentBuilder('MovieLanguageIntent')
        .require('MovieTitle').require('language').build())
    def handle_movie_language(self, message):
        self._handleMovieDetailsResponse(message, 'language')

    def _handleMovieDetailsResponse(self, message, detail):
        """ Common function for follow up intent_handlers
            Args:
            - message (object): incoming from messagebus
            - detail (string): type of detail requested [country, rating, etc]
        """
        # TODO consider making this a function
        # that is run by get_response with data passed in.
        # TODO Move dialog to dialog files for consistency and localizability
        # If multiple movies and none selected as active, user must choose one
        if len(self._currentContextTitles) > 1 and self._activeTitle == '':
            # Construct question of all current movie titles
            whichMovieDialog = 'Which movie did you mean, '
            joinStr = ', or, '
            for title in self._currentContextTitles:
                whichMovieDialog+=title+joinStr
            whichMovieDialog = whichMovieDialog[:-len(joinStr)]+'?'

            def getUserSelection(utterance, options=self._currentContextTitles):
                # TODO consider making this reusable, add 'options' param
                if not utterance:
                    return False
                # get best match that is > 50% correct
                matched = match_one(utterance, options)
                if  matched[1] > 0.5:
                    return matched[0]
                # get position based responses eg "second"
                # NB: mycroft-core issue #1877 "second one" returns 1
                num = int(extract_number(utterance, ordinals=True))
                if (0 < num <= len(options)):
                    return options[num-1]
                else:
                    return False

            def validator(utterance):
                if getUserSelection(utterance):
                    return True
                else:
                    return False
            def on_fail(utterance):
                return "Sorry I didn't catch that. "+whichMovieDialog
            userResponse = self.get_response(
                dialog=whichMovieDialog,
                validator=validator,
                num_retries=2,
                on_fail=on_fail
                )
            if userResponse:
                title = getUserSelection(userResponse)
                # Set the activeTitle to create default for future questions
                self._activeTitle = title
            else:
                self.speak_dialog('error.no.selection')

        # use activeTitle else there should be only one _currentContextTitles
        title = (self._activeTitle if self._movieDict[self._activeTitle]
                 else self._currentContextTitles[0])

        return self.speak_dialog('movie.'+detail, {
            'title': title,
            detail: self._movieDict[title][detail],
            })

    def stop(self):
        pass

    def _addMovieFromDate(self, row, moviesOnDate=[]):
        if row.getnext().getchildren()[0].get("class") == "program-film":
            moviesOnDate.append(row.getnext())
            return self._addMovieFromDate(row.getnext(), moviesOnDate)
        else:
            return moviesOnDate

    def _convertLengthStr(self, string):
        # TODO Fix instance of 1 hour.
        # Convert movie length from "122m" to "2 hours and 2 minutes"
        lengthInMinutes = string
        lengthForSpeaking = str(int(int(lengthInMinutes) / 60)) + " hours"
        if (int(lengthInMinutes) % 60 > 0):
            lengthForSpeaking += " and " + str(int(lengthInMinutes) % 60) + " minutes"
        return lengthForSpeaking

    def _fetchMovieDetails(self, movie):
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
            'length': self._convertLengthStr(movie.getchildren()[2].text[0:-1]),
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

    def _getDateFromStr(self, string):
        year = str(datetime.datetime.now().year)
        return datetime.datetime.strptime(string+" "+year, "%A %d %B %Y")

    def _getFirstDate(self, trList):
        #TODO Consider making generic getDate(self, trList, first/last)
        # Recursive function to return first date row of program
        def getFirstDateRow(row):
            if row.getchildren()[0].get("class") == "program-date":
                return row.getchildren()[0].text
            else:
                return getFirstDateRow(row.getnext())
        dateText = getFirstDateRow(trList[0])
        return self._getDateFromStr(dateText)

    def _getLastDate(self, trList):
        # Recursive function to return last date row of program
        def getLastDateRow(row):
            if row.getchildren()[0].get("class") == "program-date":
                return row.getchildren()[0].text
            else:
                return getLastDateRow(row.getprevious())
        dateText = getLastDateRow(trList[len(trList)-1])
        return self._getDateFromStr(dateText)


def create_skill():
    return DeckchairCinema()

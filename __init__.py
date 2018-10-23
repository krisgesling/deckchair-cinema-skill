from adapt.intent import IntentBuilder
from lxml import html
from mycroft import MycroftSkill, intent_file_handler
from mycroft.util.log import LOG
from mycroft.util.format import nice_time, nice_date
from mycroft.util.parse import extract_datetime
import requests
# import urllib.request
# import urllib, urllib.request
try:
    from mycroft.util.time import to_utc, to_local
except Exception:
    import pytz

__author__ = 'krisgesling'
LOGGER = LOG(__name__)

class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)

    @intent_file_handler('cinema.deckchair.intent')
    def handle_cinema_deckchair(self, message):
        try:
            # 1. Extract date, or default to today
            # Get a date from requests like "what's on at deckchair tomorrow"
            today = extract_datetime(" ")[0]
            when = extract_datetime(
                        message.data.get('utterance'), lang=self.lang)[0]
            LOG.info("SKILL FIRED")
            # 2. Scrape website for movie on this date
            webpage = requests.get('http://www.deckchaircinema.com/program/')
            dataTree = html.fromstring(webpage.content)
            # Get list of table rows from program - these alternate between date and movie[s]
            trList = dataTree.xpath('//table[@id="program"]/tbody/tr')
            #TODO Find child with provided date
            movieTitle = next(
                iter([x.getnext().getchildren()[0].getchildren()[0].text
                for x in trList
                if x.getchildren()[0].text==when.strftime("%A %d %B")]), "Not found"
            )
            #TODO test .nextchild() and return films until new date tr is found
            #TODO if date not found test date range and return some other message
            # 3. Construct message to return
            self.speak_dialog('cinema.deckchair', {'when': nice_date(when, now=today), 'movieTitle': movieTitle})
        except HTTPError as e:
            self.__api_error(e)
        except Exception as e:
            LOG.error("Error: {0}".format(e))
            self.speak_dialog('error')

    def stop(self):
        pass

    def __api_error(self, e):
        if e.response.status_code == 401:
            from mycroft import Message
            self.bus.emit(Message("mycroft.not.paired"))

    def __to_UTC(self, when):
        try:
            # First try with modern mycroft.util.time functions
            return to_utc(when)
        except Exception:
            # TODO: This uses the device timezone -- should probably use
            #       the timezone of the location being forecasted
            timezone = pytz.timezone(self.location["timezone"]["code"])
            return timezone.localize(when).astimezone(pytz.utc)

def create_skill():
    return DeckchairCinema()

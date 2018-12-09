import re
from adapt.intent import IntentBuilder
from datetime import datetime
from lxml import html
from mycroft import MycroftSkill, intent_file_handler, intent_handler
from mycroft.skills.context import adds_context, removes_context
from mycroft.util.format import nice_date, nice_time
from mycroft.util.log import LOG
from mycroft.util.parse import extract_datetime, extract_number, match_one
from requests import exceptions, get


__author__ = 'krisgesling'
LOGGER = LOG(__name__)


class DeckchairCinemaSkill(MycroftSkill):
    def __init__(self):
        super(DeckchairCinemaSkill, self).__init__(name="DeckchairCinemaSkill")
        self._active_title = ''
        self._current_titles = []
        self._movie_dict = {}

    @intent_file_handler('whats.on.intent')
    def handle_cinema_deckchair(self, message):
        try:
            # 1. Extract date, or default to today
            # Get a date from requests like "what's on at deckchair tomorrow"
            now_date = datetime.now()
            when = extract_datetime(
                message.data.get('utterance'), lang=self.lang)[0]
            when = datetime.strptime(
                'Saturday 17 November 2018', '%A %d %B %Y')
            # 2. Scrape website for movie on this date
            # webpage = get('http://www.deckchaircinema.com/program/')
            webpage = get('https://krisgesling.github.io/deckchair-cinema-skill/')
            data_tree = html.fromstring(webpage.content)
            # Get list of table rows from program
            # - these alternate between date and movie[s]
            tr_list = data_tree.xpath('//table[@id="program"]/tbody/tr')
            # Find child with provided date in format "Monday 22 October"
            try:
                date_row = next((x for x in tr_list
                if x.getchildren()[0].text==when.strftime('%A %-d %B')))
            except StopIteration:
                LOG.info('Date note found: %r' % when.strftime('%A %-d %B'))
                return self.speak_dialog('error.datenotfound',
                    {'date': nice_date(when, now=now_date)})
            # 3. Test if date is in deckchair program range
            first_date = self._get_date_from_list(tr_list, 'first')
            last_date = self._get_date_from_list(tr_list, 'last')
            if first_date <= when.replace(tzinfo=None) <= last_date:
                # 4. Add all film rows that follow a date row to a list
                movies_on_date = self._add_movie_from_date(
                    date_row, movies_on_date=[])
                # 5. Construct message to return
                movie_details_dialog = []
                for movie in movies_on_date:
                    if len(movie_details_dialog) > 0:
                        movie_details_dialog.append(', and ')
                    movie_title = movie.getchildren()[0].getchildren()[0].text
                    movie_time = nice_time(when.replace(
                        hour=int(movie.getchildren()[1].text[0:-5]),
                        minute=int(movie.getchildren()[1].text[-4:-2])))
                    movie_details_dialog.extend(
                        [movie_title, ', at ', movie_time])

                self.speak_dialog('whats.on', {
                    'when': nice_date(when, now=datetime.now()),
                    'movie_details': ''.join(movie_details_dialog)
                    })

                # 6. Fetch data and set context for follow up questions
                # Reset data from previous requests.
                self._current_titles = []
                self._active_title = ''
                for movie in movies_on_date:
                    movie_details = self._fetch_movie_details(movie)
                    self._movie_dict[movie_details['title']] = movie_details
                    self._current_titles.append(
                        movie.getchildren()[0].getchildren()[0].text
                    )
                self.set_context('MovieTitle', 'True')

            else:
                # If date is not in the range of the current film program
                self.speak_dialog('error.daterange', {
                    'when': nice_date(when, now=now_date),
                    'first_date': nice_date(first_date, now=now_date),
                    'last_date': nice_date(last_date, now=now_date)
                    })

        except ( exceptions.ConnectionError
            or exceptions.HTTPError
            or exceptions.Timeout
            or exceptions.TooManyRedirects
            ) as e:
            LOG.error('Error: {0}'.format(e))
            self.speak_dialog('error.http')
        except Exception as e:
            LOG.exception('Error: {0}'.format(e))
            self.speak_dialog('error')


    """ Handle all follow up questions
        Requirements:
        - MovieTitle (string): the context string 'True'
        - detail (vocab): detected speech located in vocab/en-us/*.voc
    """

    @intent_handler(IntentBuilder('MovieRatingIntent')
        .require('MovieTitle').require('rating').build())
    def handle_movie_rating(self, message):
        self._handle_movie_details(message, 'rating')

    @intent_handler(IntentBuilder('MovieLengthIntent')
        .require('MovieTitle').require('length').build())
    def handle_movie_length(self, message):
        self._handle_movie_details(message, 'length')

    @intent_handler(IntentBuilder('MovieDirectorIntent')
        .require('MovieTitle').require('director').build())
    def handle_movie_director(self, message):
        self._handle_movie_details(message, 'director')

    @intent_handler(IntentBuilder('MovieSynopsisIntent')
        .require('MovieTitle').require('synopsis').build())
    def handle_movie_synopsis(self, message):
        self._handle_movie_details(message, 'synopsis')

    @intent_handler(IntentBuilder('MovieYearIntent')
        .require('MovieTitle').require('year').build())
    def handle_movie_year(self, message):
        self._handle_movie_details(message, 'year')

    @intent_handler(IntentBuilder('MovieCountryIntent')
        .require('MovieTitle').require('country').build())
    def handle_movie_country(self, message):
        self._handle_movie_details(message, 'country')

    @intent_handler(IntentBuilder('MovieLanguageIntent')
        .require('MovieTitle').require('language').build())
    def handle_movie_language(self, message):
        self._handle_movie_details(message, 'language')

    def _handle_movie_details(self, message, detail):
        """ Common function for follow up intent handlers
            If multiple movies, user prompted to choose one

            Arguments:
                message (object): incoming from messagebus
                detail (string): type of detail requested eg 'rating'
            Returns: call to speak dialog
        """
        # If multiple movies and none selected as active, user must choose one
        if len(self._current_titles) > 1 and self._active_title == '':
            # Construct question of all current movie titles
            which_movie_dialog_list = ['Which movie did you mean, ']
            for title in self._current_titles:
                which_movie_dialog_list.extend((title, ', or, '))
            del which_movie_dialog_list[-1] # del last ', or, '
            which_movie_dialog = ''.join(which_movie_dialog_list)

            user_selection = False
            def validator(utterance):
                nonlocal user_selection
                user_selection = self._prompt_user_selection(
                    utterance, self._current_titles)
                if user_selection:
                    return True
                else:
                    return False
            def on_fail(utterance):
                return f'Sorry I didn\'t catch that. {which_movie_dialog}'
            user_response = self.get_response(
                dialog = which_movie_dialog,
                # dialog = 'movie.which.dialog',
                # data = {'options': which_movie_options},
                validator = validator,
                num_retries = 2,
                on_fail = on_fail
                )
            if user_response:
                # Set activeTitle as default for future questions
                self._active_title = user_selection
            else:
                self.speak_dialog('error.no.selection')

        # use activeTitle else there should be only one _current_titles
        title = self._active_title if self._active_title \
                                   and self._movie_dict[self._active_title] \
                else self._current_titles[0]
        return self.speak_dialog('movie.' + detail, {
            'title': title,
            detail: self._movie_dict[title][detail],
            })

    def stop(self):
        pass

    def _add_movie_from_date(self, row, movies_on_date = []):
        # Recursive function to add all movies on a given date
        if row.getnext().getchildren()[0].get('class') == 'program-film':
            movies_on_date.append(row.getnext())
            return self._add_movie_from_date(row.getnext(), movies_on_date)
        else:
            return movies_on_date

    @staticmethod
    def _convert_mins_to_length(total_mins):
        """ Convert length of time to speakable string
            Arguments:
            - total_mins (integer): total length in minutes
            Returns:
            - length_spoken (string): length of time as speakable dialog
                                      eg '2 hours and 2 minutes'
        """
        total_mins = int(total_mins)
        assert total_mins>0, 'Invalid input: total_mins = %r' % total_mins
        hrs = int(total_mins / 60)
        if hrs == 0:
            hrs_spoken = ''
        elif hrs == 1:
            hrs_spoken = '%d hour' % hrs
        else:
            hrs_spoken = '%d hours' % hrs
        mins = total_mins % 60
        conjoin = ' and ' if hrs>0 and mins>0 else ''
        mins_spoken = str(mins) + ' minutes' if (mins>0) else ''
        length_spoken = hrs_spoken + conjoin + mins_spoken
        return length_spoken

    def _fetch_movie_details(self, movie):
        # Fetch extra movie data from dedicated webpage
        movie_page = get(movie.getchildren()[5].getchildren()[0].get('href'))
        movie_data = html.fromstring(movie_page.content)
        synopsis_element = movie_data.xpath(
            '//div[@id="main_content"]/div[@class="container"] \
            /div[@class="row"]/div[@class="span8"] \
            /div[@class="content"]/p')
        # Sometimes they put a span tag around the synopsis text...
        synopsis = synopsis_element[0].text if synopsis_element[0].text \
                   else synopsis_element[0].getchildren()[0].text
        # Remaining details in relatively consistent locations on right side.
        right_panel = movie_data.xpath(
            '//div[@id="main_content"]/div[@class="container"] \
            /div[@class="row"]/div[@class="span4"]')[0]

        def get_info(info_type):
            # Find element containing info as heading, then return next element
            heading = next((x for x in right_panel if x.text == info_type))
            info = heading.getnext().text if heading.getnext().text \
                   else heading.getnext().getchildren().text
            return info

        # Construct return object
        movie_details = {
            # First details from program page
            'title': movie.getchildren()[0].getchildren()[0].text,
            'length': self._convert_mins_to_length(movie.getchildren()[2].text[0:-1]),
            'rating': movie.getchildren()[3].text,
            'screening_location': movie.getchildren()[4].text,
            # Remaining from movie_data
            'synopsis': synopsis,
            'director': get_info('Director'),
            'year': get_info('Year'),
            'country': get_info('Country of Origin'),
            'language': get_info('Language'),
        }
        return movie_details

    @staticmethod
    def _get_date_from_str(date_string):
        """ Get date object from date string,
            increments year if date requested is >3 months in past.
            Arguments:
            - date_string (string): in format "Saturday 17 November"
            Returns:
            - date (class): instance of datetime.date
        """
        year = str(datetime.now().year)
        date = datetime.strptime(' '.join([date_string, year]), '%A %d %B %Y')
        if date.month < datetime.now().month-3:
            date.replace(year = date.year + 1)
        return date

    def _get_date_from_list(self, tr_list, pos):
        # Recursive function to return first date row of program
        def get_date_row(row):
            if row.getchildren()[0].get('class')=='program-date':
                return row.getchildren()[0].text
            else:
                if pos=='first':
                    return get_date_row(row.getnext())
                elif pos=='last':
                    return get_date_row(row.getprevious())
        starting_element = tr_list[0] if pos=='first' \
                           else tr_list[len(tr_list)-1]
        date_text = get_date_row(starting_element)
        date = self._get_date_from_str(date_text)
        return date

    def _prompt_user_selection(self, utterance, options):
        if not utterance:
            return False
        # get best match that is > 50% correct
        (best_match, match_score) = match_one(utterance, options)
        if  match_score > 0.5:
            return best_match
        # get position based responses aka ordinals eg "second"
        num = int(extract_number(utterance, ordinals=True))
        if (0 < num <= len(options)):
            return options[num-1]
        else:
            return False

def create_skill():
    return DeckchairCinemaSkill()

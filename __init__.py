import re
from adapt.intent import IntentBuilder
from datetime import datetime, timedelta
from lxml import html
from os.path import join, exists, getmtime
from pytz import timezone
from requests import exceptions, get
from mycroft import MycroftSkill, intent_file_handler, intent_handler
from mycroft.skills.context import adds_context, removes_context
from mycroft.util.format import nice_date, nice_duration, nice_time
from mycroft.util.parse import extract_datetime, extract_duration, \
                               extract_number, match_one

__author__ = 'krisgesling'

class CinemaProgram():
    def __init__(self):
        self.remote_url = 'http://www.deckchaircinema.com/program/'
        self.cache_filename = 'program.html'

    def fetch(self, **kwargs):
        self.use_cache = False
        # Check for existing cache and test age
        if 'cache' in kwargs:
            directory, now_date = kwargs['cache']
            cache_file = '/'.join([directory, self.cache_filename])
            if exists(cache_file):
                cache_timestamp = datetime.fromtimestamp(getmtime(cache_file))
                cache_age = now_date - cache_timestamp
                self.use_cache = True if cache_age.days < 1 else False
        if self.use_cache:
            with open(cache_file, "r") as file:
                data_tree = html.fromstring(file.read())
        else:
            # Use test url passed in by skill test runner if exists
            program_url = kwargs['test_url'] if 'test_url' in kwargs \
                else self.remote_url
            # Actually fetch the program
            webpage = get(program_url).content
            data_tree = html.fromstring(webpage)
            # Save new cache if not test runner
            if 'cache' in kwargs:
                with open(cache_file, "w") as cache_file:
                    cache_file.write(str(webpage))
                    cache_file.close()

        # Get list of table rows from program
        # - these alternate between date and movie[s]
        program_tr_list = data_tree.xpath('//table[@id="program"]/tbody/tr')
        return program_tr_list


class DeckchairCinema(MycroftSkill):
    def __init__(self):
        super(DeckchairCinema, self).__init__(name="DeckchairCinema")
        self.cinema_program = CinemaProgram()
        self._current_movie_context = ''
        self._movies_on_requested_date = []
        self._movie_dict = {}
        self.testing_date = None

    @intent_file_handler('whats.on.intent')
    def handle_cinema_deckchair(self, message):
        try:
            now_date = datetime.now()
            # 1. Scrape website for movie on this date
            try:
                program_tr_list = self.cinema_program.fetch(
                    cache=[join(self.file_system.path), now_date])
            except ( exceptions.ConnectionError
                or exceptions.HTTPError
                or exceptions.Timeout
                or exceptions.TooManyRedirects
                ) as e:
                self.log.error('Error: {0}'.format(e))
                self.speak_dialog('error.http')
                return

            # 2. Extract date from utterance, or default to today
            when = extract_datetime(message.data.get('utterance'))[0]
            if self.testing_date is not None:
                when = self.testing_date

            # 3. Test if date is in deckchair program range
            first_date = self._get_date_from_list(program_tr_list, 'first')
            last_date = self._get_date_from_list(program_tr_list, 'last')
            if when < first_date or last_date < when:
                self.speak_dialog('error.datenotfound', {
                    'when': nice_date(when, now=now_date),
                    'first_date': nice_date(first_date, now=now_date),
                    'last_date': nice_date(last_date, now=now_date)
                    })
                return False

            # 4. Find movie on provided date
            try:
                date_row = next((x for x in program_tr_list
                if x.getchildren()[0].text==when.strftime('%A %-d %B')))
            except StopIteration:
                self.log.info('Date note found: {}'.format(
                    when.strftime('%A %-d %B')))
                return self.speak_dialog('error.datenotfound', {
                    'when': nice_date(when, now=now_date),
                    'first_date': nice_date(first_date, now=now_date),
                    'last_date': nice_date(last_date, now=now_date)
                    })
            movies_on_date = self._add_movie_from_date(
                date_row, movies_on_date=[])

            # 5. Construct message to return
            movie_details_dialog = []
            for movie in movies_on_date:
                if len(movie_details_dialog) > 0:
                    movie_details_dialog.append(self.translate('and'))
                movie_title = movie.getchildren()[0].getchildren()[0].text
                movie_time = nice_time(when.replace(
                    hour=int(movie.getchildren()[1].text[0:-5]),
                    minute=int(movie.getchildren()[1].text[-4:-2])))
                movie_details_dialog.append(self.translate('movie.at.time', {
                    'title': movie_title,
                    'time': movie_time
                }))

            self.speak_dialog('whats.on', {
                'when': nice_date(when, now=datetime.now()),
                'movie_details': ', '.join(movie_details_dialog)
                })

            # 6. Fetch data and set context for follow up questions
            # Reset data from previous requests.
            self._movies_on_requested_date = []
            self._current_movie_context = ''
            for movie in movies_on_date:
                movie_details = self._fetch_movie_details(movie)
                self._movie_dict[movie_details['title']] = movie_details
                self._movies_on_requested_date.append(
                    movie.getchildren()[0].getchildren()[0].text
                )
            self.set_context('DeckchairContext', 'True')

        except Exception as e:
            self.log.exception(format(e))
            self.speak_dialog('error')


    """ Handle all follow up questions
        Requirements:
        - DeckchairContext (string): the context string 'True'
        - detail (vocab): detected speech located in vocab/en-us/*.voc
    """
    @intent_handler(IntentBuilder('MovieRatingIntent')
        .require('DeckchairContext').require('what').require('rating').build())
    def handle_movie_rating(self, message):
        self._handle_movie_details(message, 'rating')

    @intent_handler(IntentBuilder('MovieLengthIntent')
        .require('DeckchairContext').require('how').require('long').build())
    def handle_movie_length(self, message):
        self._handle_movie_details(message, 'length')

    @intent_handler(IntentBuilder('MovieDirectorIntent')
        .require('DeckchairContext').require('who').require('director').build())
    def handle_movie_director(self, message):
        self._handle_movie_details(message, 'director')

    @intent_handler(IntentBuilder('MovieSynopsisIntent')
        .require('DeckchairContext').require('what').require('synopsis').build())
    def handle_movie_synopsis(self, message):
        self._handle_movie_details(message, 'synopsis')

    @intent_handler(IntentBuilder('MovieYearIntent')
        .require('DeckchairContext').require('year').build())
    def handle_movie_year(self, message):
        self._handle_movie_details(message, 'year')

    @intent_handler(IntentBuilder('MovieCountryIntent')
        .require('DeckchairContext').require('country').build())
    def handle_movie_country(self, message):
        self._handle_movie_details(message, 'country')

    @intent_handler(IntentBuilder('MovieLanguageIntent')
        .require('DeckchairContext').require('language').build())
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
        if len(self._movies_on_requested_date) > 1 and self._current_movie_context == '':
            self._prompt_user_selection(self._movies_on_requested_date)

        # use activeTitle else there should be only one _movies_on_requested_date
        title = self._current_movie_context if self._current_movie_context \
                    and self._movie_dict[self._current_movie_context] \
                else self._movies_on_requested_date[0]
        return self.speak_dialog('movie.' + detail, {
            'title': title,
            detail: self._movie_dict[title][detail],
            })

    def _add_movie_from_date(self, row, movies_on_date = []):
        # Recursive function to add all movies on a given date
        if row.getnext().getchildren()[0].get('class') == 'program-film':
            movies_on_date.append(row.getnext())
            return self._add_movie_from_date(row.getnext(), movies_on_date)
        else:
            return movies_on_date

    def _fetch_movie_details(self, movie):
        # Fetch extra movie data from dedicated webpage
        movie_page = get(movie.getchildren()[5].getchildren()[0].get('href'))
        movie_data = html.fromstring(movie_page.content)
        # TODO cache result - is it worth creating a movie class?
        duration_mins = movie.getchildren()[2].text[0:-1] + ' minutes'
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
            'length': nice_duration(extract_duration(duration_mins)[0]),
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
    def _get_date_from_str(date_string, tz='Australia/Darwin'):
        """ Get date object from date string,
            increments year if date requested is >3 months in past.
            Arguments:
            - date_string (string): in format "Saturday 17 November"
            - tz (string, optional): defaults to 'Australia/Darwin'
            Returns:
            - date (class): instance of datetime.date
        """
        year = str(datetime.now().year)
        date = datetime.strptime(' '.join([date_string, year]), '%A %d %B %Y')
        if date.month < datetime.now().month-3:
            date.replace(year = date.year + 1)
        return timezone(tz).localize(date)

    def _get_date_from_list(self, program_tr_list, pos):
        # Recursive function to return first date row of program
        def get_date_row(row):
            if row.getchildren()[0].get('class')=='program-date':
                return row.getchildren()[0].text
            else:
                if pos=='first':
                    return get_date_row(row.getnext())
                elif pos=='last':
                    return get_date_row(row.getprevious())
        starting_element = program_tr_list[0] if pos=='first' \
                           else program_tr_list[len(program_tr_list)-1]
        date_text = get_date_row(starting_element)
        date = self._get_date_from_str(date_text)
        return date

    def _get_user_selection(self, utterance, options):
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

    def _prompt_user_selection(self, movie_list):
        # Construct question of all current movie titles
        which_movie_dialog_list = [self.translate('which.movie')]
        for title in movie_list[:-1]:
            which_movie_dialog_list.append(self.translate('movie.title',
                {'title': title}))
            which_movie_dialog_list.append(self.translate('or'))
        which_movie_dialog_list.append(self.translate('movie.title',
            {'title': movie_list[-1]}))
        which_movie_dialog = ', '.join(which_movie_dialog_list)

        user_selection = False
        def validator(utterance):
            nonlocal user_selection
            user_selection = self._get_user_selection(
                utterance, movie_list)
            if user_selection:
                return True
            else:
                return False
        def on_fail(utterance):
            return self.translate('which.movie.noresponse',
                {'repeat': which_movie_dialog})
        user_response = self.get_response(
            dialog = which_movie_dialog,
            validator = validator,
            num_retries = 1,
            on_fail = on_fail
            )
        if user_response:
            # Set activeTitle as default for future questions
            self._current_movie_context = user_selection
        else:
            self.speak_dialog('error.no.selection')

    def stop(self):
        pass

def create_skill():
    return DeckchairCinema()

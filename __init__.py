from mycroft import MycroftSkill, intent_file_handler


class DeckchairCinema(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)

    @intent_file_handler('cinema.deckchair.intent')
    def handle_cinema_deckchair(self, message):
        self.speak_dialog('cinema.deckchair')


def create_skill():
    return DeckchairCinema()


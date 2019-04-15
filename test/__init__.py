from datetime import datetime
from pytz import timezone
from unittest.mock import MagicMock
from test.integrationtests.skills.skill_tester import SkillTest

def test_runner(skill, example, emitter, loader):
    # Get the skill object from the skill path
    s = [s for s in loader.skills if s and s.root_dir == skill]

    # Fetch a sample program from mocked page
    test_tr_list = s[0].cinema_program.fetch(
        test_url="https://krisgesling.github.io/deckchair-cinema-skill/")
    s[0].cinema_program = MagicMock()
    s[0].cinema_program.fetch.return_value = test_tr_list

    # Set date to match mocked page.
    testing_date = datetime.strptime('16 November 2019', '%d %B %Y')
    s[0].testing_date = timezone('Australia/Darwin').localize(testing_date)


    return SkillTest(skill, example, emitter).run(loader)

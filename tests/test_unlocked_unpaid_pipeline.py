from unlocked_unpaid_pipeline import is_pipeline_excluded, score_out_of_ten


def test_excludes_test_and_internal():
    assert is_pipeline_excluded("lead@example.com")
    assert is_pipeline_excluded("hl_wood@yahoo.com") is False
    assert is_pipeline_excluded("tbs.malhar@gmail.com") is False
    assert is_pipeline_excluded("mike.holownych@gmail.com")
    assert is_pipeline_excluded("qa-foo@bar.com")
    assert is_pipeline_excluded("someone@example.invalid")


def test_score_is_out_of_ten():
    assert score_out_of_ten(73) == "7.3/10"
    assert score_out_of_ten(7.3) == "7.3/10"
    assert score_out_of_ten(None) == "n/a"

from ramp_pipeline_fill import check_icp_fit


def test_advertising_news_is_not_a_buying_trigger():
    fit, reason = check_icp_fit(
        "Crypto firms have spent $189M on the 2026 election, report says",
        "hackernews",
    )

    assert fit is False
    assert reason.startswith("no_buying_trigger")


def test_first_person_ad_spend_with_zero_sales_is_a_buying_trigger():
    fit, reason = check_icp_fit(
        "I'm a founder. I spent $1,000 on Facebook ads and got clicks but zero sales.",
        "reddit_ad_spend_waste",
    )

    assert fit is True
    assert reason.startswith("buying_trigger")


def test_founder_with_conversion_pain_remains_qualified():
    fit, reason = check_icp_fit(
        "Solo founder here. My SaaS gets traffic but no signups.",
        "indiehackers",
    )

    assert fit is True
    assert reason.startswith("founder_with_pain")

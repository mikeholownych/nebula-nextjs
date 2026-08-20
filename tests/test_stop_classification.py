from agentmail_client import AgentMailClient


def test_bare_stop_is_unsubscribe():
    am = AgentMailClient.__new__(AgentMailClient)
    body = "STOP\n\nBest regards,\nChris Latam\nFounder at Fire For Effect Marketing"
    assert am.classify_reply({"subject": "RE: conversion score"}, body) == "unsubscribe"


def test_stop_emailing_still_unsubscribes():
    am = AgentMailClient.__new__(AgentMailClient)
    assert am.classify_reply({"subject": "hi"}, "Please stop emailing me.") == "unsubscribe"

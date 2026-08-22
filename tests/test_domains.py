#!/usr/bin/env python3
import unittest

from platform_api.services.domains import email_domain, is_freemail, registered_domain


class RegisteredDomainTests(unittest.TestCase):
    def test_strips_scheme_path_port_and_www(self):
        self.assertEqual(registered_domain("https://app.loom.com/x?a=1"), "loom.com")
        self.assertEqual(registered_domain("http://WWW.Example.COM:8080/"), "example.com")
        self.assertEqual(registered_domain("basecamp.com"), "basecamp.com")

    def test_public_suffix_multi_part(self):
        self.assertEqual(registered_domain("https://shop.co.uk"), "shop.co.uk")
        self.assertEqual(registered_domain("https://a.b.shop.co.uk"), "shop.co.uk")

    def test_invalid_returns_none(self):
        self.assertIsNone(registered_domain(""))
        self.assertIsNone(registered_domain("not a url"))
        self.assertIsNone(registered_domain("https://"))


class FreemailTests(unittest.TestCase):
    def test_known_providers(self):
        for bad in ["a@gmail.com", "b@outlook.com", "c@yahoo.co.uk", "d@icloud.com", "e@proton.me"]:
            self.assertTrue(is_freemail(bad), bad)

    def test_corporate_domain_not_freemail(self):
        self.assertFalse(is_freemail("rep@loom.com"))
        self.assertFalse(is_freemail("loom.com"))


class EmailDomainTests(unittest.TestCase):
    def test_extracts_and_normalizes(self):
        self.assertEqual(email_domain("Rep@Loom.com "), "loom.com")
        self.assertIsNone(email_domain("not-an-email"))
        self.assertIsNone(email_domain("a@gmail"))


if __name__ == "__main__":
    unittest.main()

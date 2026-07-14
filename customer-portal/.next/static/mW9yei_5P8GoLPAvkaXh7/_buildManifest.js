self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/",
        "destination": "/index.html"
      },
      {
        "source": "/:path(\\w+-\\w+-\\w+)",
        "destination": "/:path.html"
      },
      {
        "source": "/:path(\\w+-\\w+)",
        "destination": "/:path.html"
      },
      {
        "source": "/:path(\\w+)",
        "destination": "/:path.html"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()
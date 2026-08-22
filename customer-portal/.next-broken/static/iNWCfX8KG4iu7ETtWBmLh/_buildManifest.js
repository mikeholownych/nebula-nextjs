self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/.well-known/bimi.svg",
        "destination": "/api/bimi"
      },
      {
        "source": "/teardowns/:slug.md",
        "destination": "/md/teardowns/:slug"
      },
      {
        "source": "/learning-centre/:slug.md",
        "destination": "/md/learning-centre/:slug"
      },
      {
        "source": "/ingest/static/:path*"
      },
      {
        "source": "/ingest/array/:path*"
      },
      {
        "source": "/ingest/:path*"
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
        "source": "/primer",
        "destination": "/primer.html"
      },
      {
        "source": "/widget/demo",
        "destination": "/widget/demo.html"
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
# UTM segmentation - Docs

UTM parameters are a set of five parameters that enable you to track the effectiveness of marketing campaigns across traffic sources. These parameters were first introduced by Google Analytics, but are now a common way to identify where traffic to your website is coming from. They are especially useful when running ad campaigns, as nearly every platform will set them when sending traffic to your website and you can set them yourself.

The parameters are appended to a URL using query parameters, for example:

`https://www.example.com/page?utm_source=twitter&utm_medium=social&utm_campaign=twitter-campaign`

## Capturing UTM parameters

PostHog automatically captures any UTM parameters that are present when a user visits your website. These parameters are then set as properties in three places in PostHog.

1.  As properties on the event
2.  As **latest** and **initial** properties on the person profile
3.  As **entry** session properties

**Setting person properties**

Person properties are set when person profiles are created or updated via events like `$set` or `$identify`. By default, only identified users have person profiles. See our [person properties documentation](/docs/product-analytics/person-properties.md#how-to-set-person-properties) and [anonymous vs identified events documentation](/docs/data/anonymous-vs-identified-events.md) for more details.

PostHog supports all 5 parameters:

| Parameter | Purpose | Example |
| --- | --- | --- |
| utm_source | Identifies which site sent the traffic, for example, traffic from Google or Facebook. | utm_source=google |
| utm_medium | Allows you to track the type of link was used, for example cost per click, or social sharing. | utm_medium=cpc |
| utm_campaign | Helps identify specific promotions or campaigns, for example, when you run an ad campaign. | utm_campaign=google-ad-campaign |
| utm_content | Can be used to differentiate the same link on different places. | utm_content=footer-link |
| utm_term | Used to identify paid keyword searches. | utm_term=analytics+open+source |

Here's an example of what an event looks like when all 5 UTM parameters are set.

![Sample UTM properties](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/properties-light-mode.png)![Sample UTM properties](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/properties-dark-mode.png)

> **Note:** Although they aren't UTMs, PostHog autocaptures more properties with a similar use including:
>
> -   `$referrer` and `$referring_domain` as event properties
> -   `$initial_referrer`, `$initial_referring_domain` as person properties
> -   `$entry_referring_domain`, `$entry_gclid`, `$entry_gad_source` as session properties [Channel type](/docs/data/channel-type.md) is also calculated based on UTM data.

## Custom UTM parameters

You can configure [`posthog-js`](/docs/libraries/js/config.md) to capture any custom query parameters that you want to track by adding them to the `custom_campaign_params` array.

JavaScript

PostHog AI

```javascript
posthog.init('<ph_project_token>', {
    custom_campaign_params: ["my_custom_utm_source"]
})
// Will automatically capture `example.com?my_custom_utm_source=twitter`
```

## Filtering based on UTM parameters

One of the most common uses for UTM parameters is to filter down page views to only a single source or campaign. This allows you to then create insights that track and compare the effectiveness of different ad providers or using different content.

As an example, let's say we want to use UTM parameters to track the conversion rate of traffic from a particular campaign. To do this, we'll create a [funnel](/docs/user-guides/funnels.md) insight with the following filter applied.

![Filtering UTM properties](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/filters-light-mode.png)![Filtering UTM properties](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/filters-dark-mode.png)

> **Note:** You can only filter by UTM properties once they have been set on *at least one* event. If you don't see them as an option, it probably means that you haven't yet received an event where that parameter was set.

This filter means that we only want to see events where the `utm_campaign` was set to `spring sale`.

Next, we can get a better idea of which platforms are giving us the best result by breaking down based on the UTM Source.

![Breakdown by UTM Source](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/breakdown-light-mode.png)![Breakdown by UTM Source](https://res.cloudinary.com/dmukukwp6/image/upload/posthog.com/contents/images/docs/user-guides/utm-segmentation/breakdown-dark-mode.png)

This enables us to see how our conversion rate compares across platforms where we're running our ad campaign and figure out where we're getting the highest-quality traffic from.

### Community questions

Ask a question

### Was this page useful?

HelpfulCould be better
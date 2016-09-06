# Overview

This bot will facilitate homework submission and grading via Slack. The expectation is students will deploy homework as a Github.io page (look at [Gitbot](http://gitbot.co) for an easy way to push to gh-pages). The github.io url can be pasted into slack as:

```
/homework [github.io url]
```

On submission, a Trello board will generate three lists: 

1. **submissions**
2. **grading**
3. **graded**.

In these lists, cards will be generated for each submission (initially added to **submissions** list), including student name (queried from slack) and three URLs: 

1. Github repo url
2. Github.io url
3. GitHub commits URL

The teacher or TA can supply comments to individual commits. Once grading is completed, simply move the card to the **graded** list and a webhook will send the student a PM with a link to the Github commits URL page with all comments included.

# How to Deploy

This bot is built to run as a [Webtask](https://webtask.io/). On slack, it as a [custom slash command](https://api.slack.com/slash-commands).

Additionally, a few tokens are required in ``appconfig.js``.

# Update

```
wt update homework homework.js
```

# WATCH

```
./node_modules/.bin/wt-bundle --watch --output ./homework.js ./index.js
```

# LOGS

```
wt logs
```




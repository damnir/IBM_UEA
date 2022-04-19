from __future__ import print_function

import os
import os.path
import json
import time

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/presentations']

# The ID of a sample presentation.
PRESENTATION_ID = '1PYJKAZwK8OhWF6uyFRI-VuiMMkFmgYZ4PhZXVXJNIHA'


def main():
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('./gapis/token.json'):
        creds = Credentials.from_authorized_user_file(
            './gapis/token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                './gapis/credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('./gapis/token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('slides', 'v1', credentials=creds)

        elements = []

        # Call the Slides API
        presentation = service.presentations().get(
            presentationId=PRESENTATION_ID).execute()
        slides = presentation.get('slides')

        size = {'width': {'magnitude': 3000000, 'unit': 'EMU'},
                'height': {'magnitude': 3000000, 'unit': 'EMU'}}
        transform = {'scaleX': 1.0244, 'scaleY': 0.95,
                     'translateX': 399125, 'translateY': 2459275, 'unit': 'EMU'}

    except HttpError as err:
        print(err)

    requests = [
        {
            "duplicateObject": {
                "objectId": "main_slide"
            }
        }
    ]

    body = {
        'requests': requests
    }
    response = service.presentations() \
        .batchUpdate(presentationId=PRESENTATION_ID, body=body).execute()

    next_slide = response.get('replies')[0]['duplicateObject']['objectId']
    requests = []
    i = 0
    watson = open("./data/watson_response.json", 'r', encoding="utf8")
    data = json.load(watson)
    for tweet in data['result']['results']:

        # sentiment
        sentiment = "{} ({})".format(tweet['enriched_text']['sentiment']['document']
                     ['label'], tweet['enriched_text']['sentiment']['document']['score'])
        # entities
        entities = ""
        for s in tweet['enriched_text']['entities']:
            entities += "{} ({}) ".format(s['text'], s['relevance'])

        concepts = ""
        for s in tweet['enriched_text']['concepts']:
            concepts += "{} ({}) ".format(s['text'], s['relevance'])

        categories = ""
        for s in tweet['enriched_text']['categories']:
            categories += "{}({}) ".format(s['label'], s['score'])

        image = False

        if(tweet['url'] != ""):
            image = True

        requests = [
            {
                "duplicateObject": {
                    "objectId": "main_slide"
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{username}}',
                        'matchCase': False
                    },
                    'replaceText': tweet['name']
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{text}}',
                        'matchCase': False
                    },
                    'replaceText': tweet['text'].replace("*nl*", "\n")
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{sentiment}}',
                        'matchCase': False
                    },
                    'replaceText': sentiment
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{entities}}',
                        'matchCase': False
                    },
                    'replaceText': entities
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{concepts}}',
                        'matchCase': False
                    },
                    'replaceText': concepts
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{categories}}',
                        'matchCase': False
                    },
                    'replaceText': categories
                }
            },
        ]

        if image:
            emu4M = {
                'magnitude': 4000000,
                'unit': 'EMU'
            }
            requests.append({
                'createImage': {
                    'objectId': tweet['t_id'] + "img",
                    'url': tweet['url'],
                    'elementProperties': {
                        'pageObjectId': next_slide,
                        'size': size,
                        'transform': transform
                    }
                }
            })

        body = {
            'requests': requests
        }
        response = service.presentations() \
            .batchUpdate(presentationId=PRESENTATION_ID, body=body).execute()

        print(response)

        next_slide = response.get('replies')[0]['duplicateObject']['objectId']
        # print(next_slide)
        # print(response)
        requests = []
        i = i+1
        # time.sleep(4)


if __name__ == '__main__':
    main()

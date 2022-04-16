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
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('slides', 'v1', credentials=creds)

        elements = []

        # Call the Slides API
        presentation = service.presentations().get(
            presentationId=PRESENTATION_ID).execute()
        slides = presentation.get('slides')

        size = {'width': {'magnitude': 3000000, 'unit': 'EMU'}, 'height': {'magnitude': 3000000, 'unit': 'EMU'}}
        transform = {'scaleX': 1.0244, 'scaleY': 0.95, 'translateX': 399125, 'translateY': 2459275, 'unit': 'EMU'}

    except HttpError as err:
        print(err)

    requests = [
    {
        "duplicateObject" : {
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

    for filename in os.listdir("../data/query_result/"):
        with open(os.path.join("../data/query_result/", filename), 'r') as f:
            jf = json.load(f)
            image = False

            if(jf['url'] != ""):
                image = True

            requests = [
            {
                "duplicateObject" : {
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
                    'replaceText': jf['name']
                }
            },
            {
                'replaceAllText': {
                    'pageObjectIds': [next_slide],
                    'containsText': {
                        'text': '{{text}}',
                        'matchCase': False
                    },
                    'replaceText': jf['text'].replace("*nl*", "\n")
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
                    'objectId': "img1esgreg4wg42sdstg",
                    'url': jf['url'],
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
            # time.sleep(4)

      


if __name__ == '__main__':
    main()

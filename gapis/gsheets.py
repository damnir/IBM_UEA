from __future__ import print_function

import os.path
import json

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

# The ID and range of a sample spreadsheet.
SAMPLE_SPREADSHEET_ID = '1HLmj5BNqdCj-k7s9e3Q4gYhiLQjtcxpXnkpAj1p7SBk'
SAMPLE_RANGE_NAME = 'A2:G2'


def main():
    """Shows basic usage of the Sheets API.
    Prints values from a sample spreadsheet.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('./gapis/tokenSheets.json'):
        creds = Credentials.from_authorized_user_file('./gapis/tokenSheets.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                './gapis/credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('./gapis/tokenSheets.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('sheets', 'v4', credentials=creds)

    except HttpError as err:
        print(err)


    rng = 2
    watson = open("./data/watson_response.json", 'r', encoding="utf8")
    data = json.load(watson)
    for tweet in data['result']['results']:

        # sentiment
        sentiment = "{} ({})".format(tweet['enriched_text']['sentiment']['document']
                     ['label'], tweet['enriched_text']['sentiment']['document']['score'])
        # entities
        entities = ""
        for s in tweet['enriched_text']['entities']:
            entities += "{} ({})\n".format(s['text'], s['relevance'])

        concepts = ""
        for s in tweet['enriched_text']['concepts']:
            concepts += "{} ({})\n".format(s['text'], s['relevance'])

        categories = ""
        for s in tweet['enriched_text']['categories']:
            categories += "{}({})\n".format(s['label'], s['score'])

        cell_range = ("A{}:G{}").format(rng, rng); rng+=1

        #id, name, text, sentiment, concepts, keyword, categories
        values = [
            [
                tweet['t_id'], tweet['name'], tweet['text'].replace('*nl*', '\n'), sentiment, entities, concepts, categories
            ]
        ]

        body = {
            'values':values
        }

        result = service.spreadsheets().values().update(
        spreadsheetId=SAMPLE_SPREADSHEET_ID, range=cell_range,
        valueInputOption='RAW', body=body).execute()

if __name__ == '__main__':
    main()
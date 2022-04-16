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
    if os.path.exists('tokenSheets.json'):
        creds = Credentials.from_authorized_user_file('tokenSheets.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('tokenSheets.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('sheets', 'v4', credentials=creds)

    except HttpError as err:
        print(err)


    rng = 2
    for filename in os.listdir("../data/query_result/"):
        with open(os.path.join("../data/query_result/", filename), 'r') as f:
            jf = json.load(f)

            cell_range = ("A{}:G{}").format(rng, rng); rng+=1

            #id, name, text, sentiment, concepts, keyword, categories
            values = [
                [
                    jf['id'], jf['name'], jf['text'].replace('*nl*', '\n'), "placeholder", "placeholder", "placeholder", "placeholder"
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
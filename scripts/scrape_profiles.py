from bs4 import BeautifulSoup
import requests
import re

url = 'https://www.4icu.org/twitter/gb/'
# url = 'https://www.4icu.org/top-universities-twitter/'

req = requests.get(url)

soup = BeautifulSoup(req.content, 'html.parser')

res = soup.find_all("a", href=re.compile("https://twitter"))

f = open("account.txt", "w")
for i in res:
    username = i.get('href').split("/")[-1]
    f.write(str(username)+'\n')

f.close()


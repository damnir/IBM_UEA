import os
import json
import codecs

file = open("test.json", "w")

data = []

for filename in os.listdir("./query_result/"):
    with open(os.path.join("./query_result/", filename), encoding="utf8") as f:
        content = f.read()
        data.append(content+",\n")
        print("\n", content)

jsondata = json.dumps(data)
file.write(jsondata)

# file.write(content)
file.close()



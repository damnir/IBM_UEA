
accsFile = open("../data/accounts-russel-group.txt" ,"r")
queryFile = open("query2.txt", "w")

accounts = accsFile.readlines()

query = "ibm ("

for acc in accounts:
    temp = query + f"from:{acc[:-1]} OR "

    if (len(temp) > 186):
        queryFile.write(query[:-4]+")\n")
        query = "ibm ("f"from:{acc[:-1]} OR "
    else:
        query = temp

queryFile.write(query[:len(query)-4]+")\n")
print(query)

accsFile.close()
queryFile.close()
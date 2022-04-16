package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"

	twitterscraper "github.com/n0madic/twitter-scraper"
)

func run_search(query string, retweets bool) {

	if retweets {
		query += " include:nativeretweets include:retweets include:replies until:2023-01-02 since:2022-01-01"
		// query += " include:nativeretweets include:retweets until:2022-04-10 since:2021-01-01"
		println(query + "\n")
	}

	var tweets []string

	f, err := os.OpenFile("data/query_result.txt",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println(err)
	}
	defer f.Close()

	// f2.WriteString(" { \"tweets\": {\n")

	scraper := twitterscraper.New()
	scraper.SetSearchMode(twitterscraper.SearchLatest)
	// fmt.Printf("here...")
	// fmt.Printf("sending... %s\n\n", query)

	for tweet := range scraper.WithDelay(1).SearchTweets(context.Background(),
		query, 15) { //50 limit
		if tweet.Error != nil {
			panic(tweet.Error)
		}
		// tweet.

		// unixTimeUTC := time.Unix(tweet.Timestamp, 0) //gives unix time stamp in utc

		// unitTimeInRFC3339 := unixTimeUTC.Format(time.RFC3339) //

		// fmt.Printf("\nRT: %t Created at: %s\nName: %s\nText: %s\n\n\n", tweet.IsRetweet, unitTimeInRFC3339, tweet.Username, tweet.Text)
		// fmt.Println(tweet.IsRetweet)
		tweets = append(tweets, tweet.ID)

		// if _, err := f.WriteString("ID: " + tweet.ID + " Text: " + tweet.Text + "\n"); err != nil {
		// 	log.Println(err)
		// }

		if _, err := f.WriteString(tweet.ID + "\n"); err != nil {
			log.Println(err)
		}

		// f2, err := os.Create("data/query_result/" + tweet.ID + ".json")

		// if err != nil {
		// 	log.Fatal(err)
		// }

		// defer f2.Close()

		// toJson(tweet.Tweet, f2)
		toJson(tweet.Tweet)

	}

}

func fetch(query string) {
	scraper := twitterscraper.New()
	//scraper.SetSearchMode(twitterscraper.SearchLatest)
	fmt.Printf("now trying: %s\n", query)
	// query += " until:2022-04-07"

	for tweet := range scraper.WithDelay(1).GetTweets(context.Background(),
		query, 5) { //50 limit
		if tweet.Error != nil {
			panic(tweet.Error)
		}

		unixTimeUTC := time.Unix(tweet.Timestamp, 0) //gives unix time stamp in utc

		unitTimeInRFC3339 := unixTimeUTC.Format(time.RFC3339) //

		// println("sending: " + tweet.Username)

		// println(tweet.IsRetweet)
		// if (strings.Contains(tweet.HTML, "IBM") || strings.Contains(tweet.HTML, "ibm") || strings.Contains(tweet.HTML, "@IBM")) && tweet.IsRetweet {
		// 	// println("RETWEET: " + tweet.Text)
		// 	// fmt.Print("\nRT: %s - date cre")
		// 	fmt.Printf("Date created: %s\n Text: %s\n", unitTimeInRFC3339, tweet.Text)
		// }
		fmt.Printf("Date created: %s\n Text: %s\n", unitTimeInRFC3339, tweet.Text)

	}
}

func get_tweet(id string) {
	scraper := twitterscraper.New()
	tweet, err := scraper.GetTweet(id)
	if err != nil {
		panic(err)
	}
	fmt.Println(tweet.Retweets)
}

func test_users(locations []string) {
	scraper := twitterscraper.New().SetSearchMode(twitterscraper.SearchUsers)

	f, err := os.Create("accounts_new.txt")

	if err != nil {
		log.Fatal(err)
	}

	defer f.Close()

	for profile := range scraper.WithDelay(2).SearchProfiles(context.Background(), "university", 5000) {
		if profile.Error != nil {
			panic(profile.Error)
		}
		fmt.Printf("Location: %s, Username: %s\n", profile.Location, profile.Name)
		// fmt.Println(profile.Profile)

		loc := profile.Location

		for _, location := range locations {
			if strings.Contains(loc, location) {
				_, err2 := f.WriteString(profile.Username + "\n")

				if err2 != nil {
					log.Fatal(err2)
				}
				break
			}
		}

	}
}

func query_all() {

	file, err := os.Open("data/query.txt")

	if err != nil {
		log.Fatalf("failed to open")
	}

	scanner := bufio.NewScanner(file)

	scanner.Split(bufio.ScanLines)
	var queries []string

	for scanner.Scan() {
		queries = append(queries, scanner.Text())
	}

	for _, query := range queries {
		// fmt.Println(query)
		run_search(query, true)
	}

	file.Close()

}

type TweetCompact struct {
	T_id   string `json:"t_id"`
	Name   string `json:"name"`
	ImgUrl string `json:"url"`
	Text   string `json:"text"`
}

func toJson(tweet twitterscraper.Tweet) {

	// e, err := json.MarshalIndent(tweet, "", " ")
	// if err != nil {
	// 	fmt.Println(err)
	// 	return
	// }
	// fp.WriteString(string(e))
	var text = tweet.Text
	text = strings.Replace(text, "\n", " *nl* ", -1)

	// if len(tweet.Photos) >= 1 {
	// 	fp.WriteString("{\"tweet_id\":" + "\"" + tweet.ID + "\"" + ",\n\"image\":" + "\"" + tweet.Photos[0] + "\"" + ",\n\"text\":" + "\"" + text + "\"\n}")
	// } else {
	// 	fp.WriteString("{\"tweet_id\":" + "\"" + tweet.ID + "\"" + ",\n\"text\":" + "\"" + text + "\"\n}")
	// }

	var photo_url = ""

	if len(tweet.Photos) >= 1 {
		photo_url = tweet.Photos[0]
	}

	data := &TweetCompact{
		T_id:   tweet.ID,
		Name:   tweet.Username,
		ImgUrl: photo_url,
		Text:   text,
	}

	// println(data.T_id)
	// println(data.text)

	out, _ := json.MarshalIndent(data, "", " ")
	println(string(out))

	_ = ioutil.WriteFile("data/query_result/"+tweet.ID+".json", out, 0644)
}

func main() {

	// switch os.Args[1] {
	// case "custom":
	// 	run_search(os.Args[2], false)
	// case "all":
	// 	query_all()
	// }
	err := os.RemoveAll("data/query_result")
	if err != nil {
		log.Fatal(err)
	}

	os.Mkdir("data/query_result/", os.ModePerm)

	f, err := os.Create("data/query_result.txt")

	if err != nil {
		log.Fatal(err)
	}

	defer f.Close()

	if os.Args[1] == "a" {
		query_all()
	} else {
		run_search(os.Args[1], false)
	}

}

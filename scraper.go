package main

import (
	"bufio"
	"context"
	"fmt"
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

	scraper := twitterscraper.New()
	scraper.SetSearchMode(twitterscraper.SearchLatest)
	// fmt.Printf("here...")
	// fmt.Printf("sending... %s\n\n", query)

	for tweet := range scraper.WithDelay(1).SearchTweets(context.Background(),
		query, 25) { //50 limit
		if tweet.Error != nil {
			panic(tweet.Error)
		}
		// tweet.

		unixTimeUTC := time.Unix(tweet.Timestamp, 0) //gives unix time stamp in utc

		unitTimeInRFC3339 := unixTimeUTC.Format(time.RFC3339) //

		fmt.Printf("\nRT: %t Created at: %s\nName: %s\nText: %s\n\n\n", tweet.IsRetweet, unitTimeInRFC3339, tweet.Username, tweet.Text)
		// fmt.Println(tweet.IsRetweet)
		tweets = append(tweets, tweet.ID)

		if _, err := f.WriteString(tweet.ID + "\n"); err != nil {
			log.Println(err)
		}

	}

	fmt.Printf("\n\n len = %d \n\n", len(tweets))
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

func main() {

	// switch os.Args[1] {
	// case "custom":
	// 	run_search(os.Args[2], false)
	// case "all":
	// 	query_all()
	// }

	if os.Args[1] == "a" {
		query_all()
	} else {
		run_search(os.Args[1], false)
	}

}

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

type TweetCompact struct {
	T_id   string `json:"t_id"`
	Name   string `json:"name"`
	ImgUrl string `json:"url"`
	Text   string `json:"text"`
}

//main query function
func run_search(query string, retweets bool, replies bool, until string, since string) {

	//check the parameters and update the query accordingly
	if retweets {
		query += " include:nativeretweets include:retweets"
	}
	if replies {
		query += " include:replies"
	}
	query += (" until:" + until + " since:" + since)

	var tweets []string

	//save all responses in this file
	f, err := os.OpenFile("data/query_result.txt",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Println(err)
	}
	defer f.Close()

	//!!Have to save results locally to a file bc there isn't a nice way to send them back to javascript

	scraper := twitterscraper.New()
	scraper.SetSearchMode(twitterscraper.SearchLatest) //search latest endpoint - more accurate results

	for tweet := range scraper.WithDelay(1).SearchTweets(context.Background(),
		query, 100) { //50 limit but can go over with cursors
		if tweet.Error != nil {
			panic(tweet.Error)
		}

		tweets = append(tweets, tweet.ID)

		if _, err := f.WriteString(tweet.ID + "\n"); err != nil {
			log.Println(err)
		}

		fmt.Println(tweet)

		toJson(tweet.Tweet)

	}

}

//function to scrap UK uni associated accounts
func scrape_users(locations []string) {
	scraper := twitterscraper.New().SetSearchMode(twitterscraper.SearchUsers)

	f, err := os.Create("accounts_new.txt")

	if err != nil {
		log.Fatal(err)
	}

	defer f.Close()

	//first scrape all profiles associated with the keyword 'university'
	for profile := range scraper.WithDelay(2).SearchProfiles(context.Background(), "university", 5000) {
		if profile.Error != nil {
			panic(profile.Error)
		}

		fmt.Printf("Location: %s, Username: %s\n", profile.Location, profile.Name)

		loc := profile.Location

		//for every account, check the location against every location from the file
		for _, location := range locations {
			if strings.Contains(loc, location) { //if it matches a UK location, add to the list
				_, err2 := f.WriteString(profile.Username + "\n")

				if err2 != nil {
					log.Fatal(err2)
				}
				break
			}
		}

	}
}

//foramt the ALL query
func query_all(qt string, retweets bool, replies bool, until string, since string) {

	path := ""
	if qt == "russel" { //load in ALL queries
		path = "data/query2.txt"
	} else { //load in Russel queries
		path = "data/query.txt"
	}

	file, err := os.Open(path)

	if err != nil {
		log.Fatalf("failed to open")
	}

	scanner := bufio.NewScanner(file)

	scanner.Split(bufio.ScanLines)
	var queries []string

	for scanner.Scan() {
		queries = append(queries, scanner.Text())
	}

	//run search for every query individually
	for _, query := range queries {
		run_search(query, true, true, until, since)
	}

	file.Close()

}

//convert Tweet object to TweetCompact and parse as JSON
func toJson(tweet twitterscraper.Tweet) {
	var text = tweet.Text

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

	out, _ := json.MarshalIndent(data, "", " ")

	_ = ioutil.WriteFile("data/query_result/"+tweet.ID+".json", out, 0644)
}

//Mainly for testing! - fetch user's timeline
func fetch(query string) {
	scraper := twitterscraper.New()

	for tweet := range scraper.WithDelay(1).GetTweets(context.Background(),
		query, 5) { //50 limit
		if tweet.Error != nil {
			panic(tweet.Error)
		}

		unixTimeUTC := time.Unix(tweet.Timestamp, 0)

		unitTimeInRFC3339 := unixTimeUTC.Format(time.RFC3339)

		fmt.Printf("Date created: %s\n Text: %s\n", unitTimeInRFC3339, tweet.Text)

	}
}

//Mainly for testing! - fetch a single tweet by id
func get_tweet(id string) {
	scraper := twitterscraper.New()
	tweet, err := scraper.GetTweet(id)
	if err != nil {
		panic(err)
	}
	fmt.Println(tweet.Retweets)
}

func main() {

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

	until := os.Args[3]
	since := os.Args[4]

	replies := false
	retweets := false

	if strings.Contains(os.Args[2], "r") {
		retweets = true
	}
	if strings.Contains(os.Args[2], "p") {
		replies = true
	}

	switch os.Args[1] {
	case "russel":
		query_all("russel", retweets, replies, until, since)
		break
	case "all":
		query_all("all", retweets, replies, until, since)
		break
	default:
		run_search("ibm from:"+os.Args[1], retweets, replies, until, since)
	}

}

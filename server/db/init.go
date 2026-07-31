package db

import (
	"context"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"schej.it/server/logger"
)

var Client *mongo.Client
var Db *mongo.Database
var EventsCollection *mongo.Collection
var UsersCollection *mongo.Collection
var DailyUserLogCollection *mongo.Collection
var FriendRequestsCollection *mongo.Collection
var EventResponsesCollection *mongo.Collection
var AttendeesCollection *mongo.Collection
var FoldersCollection *mongo.Collection
var FolderEventsCollection *mongo.Collection
var OtpCodesCollection *mongo.Collection

func DatabaseName() string {
	if name := os.Getenv("MONGODB_DATABASE"); name != "" {
		return name
	}

	return "timeful"
}

func Init() func() {
	// Establish mongodb connection
	var ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost"
	}

	Client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		logger.StdErr.Panicln(err)
	}

	// Define mongodb database + collections
	Db = Client.Database(DatabaseName())
	EventsCollection = Db.Collection("events")
	UsersCollection = Db.Collection("users")
	DailyUserLogCollection = Db.Collection("dailyuserlogs")
	FriendRequestsCollection = Db.Collection("friendrequests")
	EventResponsesCollection = Db.Collection("eventResponses")
	AttendeesCollection = Db.Collection("attendees")
	FoldersCollection = Db.Collection("folders")
	FolderEventsCollection = Db.Collection("folderEvents")
	OtpCodesCollection = Db.Collection("otpCodes")

	// Create TTL index so expired OTP docs are auto-deleted
	otpIndexModel := mongo.IndexModel{
		Keys:    bson.M{"expiresAt": 1},
		Options: options.Index().SetExpireAfterSeconds(0),
	}
	OtpCodesCollection.Indexes().CreateOne(context.Background(), otpIndexModel)

	// Return a function to close the connection
	return func() {
		Client.Disconnect(ctx)
	}
}

// MongoDB backup / restore commands

// Backup
// mongodump --uri="mongodb://localhost:27017" --db=timeful

// Restore
// mongorestore --uri="mongodb://localhost:27017" --drop --db=timeful ./dump

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//make connection with DB
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_ATLAS_DB, {useNewUrlParser: true});

//create mongoose schema for item
const itemsSchema = {
    name: String
}

//creating mongoose schema for list
const listSchema = {
    name: String,
    items: [itemsSchema]
};

//create mongoose model for Item
const Item = mongoose.model("Item", itemsSchema);

//create mongoose model for List
const List = mongoose.model("List", listSchema);

//create default items
const item1 = new Item ({
    name: "Welcome to your toDoLIst!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit this to delete an item."
});

//create array of default items
const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
    
    //find and render default items
    Item.find({}, function(err, foundItems){
        
        //insert array of default items into model if no items found
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err){
                if (err) {
                    console.log(err);
                } else {
                    console.log("successfully saved default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });

});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    //searches DB for list to save new item in
    if (listName === "Today") {
        item.save();
        res.redirect("/");        
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
});

app.get("/:customListName", function(req, res) {
    const requestedListName = _.capitalize(req.params.customListName);

    //searches DB for existing list 
    List.findOne({name: requestedListName}, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: requestedListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + requestedListName);
            } else {
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        };
    });
});

app.post("/delete", function (req, res) {
    const checkedItemID = req.body.checkbox;
    const listTitle = req.body.listName;
    //searches DB for list to remove an item
    if (listTitle === "Today") {
        Item.findByIdAndRemove(checkedItemID, function(err){
            if(!err) {
                console.log("Successfully deleted item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name:listTitle}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
            if (!err) {
                res.redirect("/" + listTitle);
            }
        });
    }
});


app.listen(process.env.PORT, function() {
    console.log("Servering running on port 3000");
});
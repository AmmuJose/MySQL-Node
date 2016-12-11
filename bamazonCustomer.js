var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'Bamazon'
});

connection.connect(function (error) {
    if (error) {
        console.error('error connecting: ' + error.stack);
        return;
    }
    console.log("---------------------------------------------------------");
    getData();
});

function getData() {
    connection.query("SELECT * FROM products", function (error, data) {
        if (error) throw error;
        getUserPrompt(data);
    });
}

function getUserPrompt(data) {
    var options = [];
    for (d in data) {
        options[d] = data[d].item_id + " : " + data[d].product_name;
    }
    inquirer.prompt([
        {
            type: "list",
            name: "productId",
            message: "Which Product You would like to Buy?",
            choices: options,
        },
        {
            type: "input",
            name: "quantity",
            message: "How many unit of Product you want to Buy?"
        }
    ]).then(function (userInput) {

        var product = userInput.productId.split(" :");
        var productId = product[0];

        connection.query("SELECT * FROM products WHERE ?",
            [{ item_id: productId }],
            function (error, data) {
                if (error) throw error;
                checkStock(data, userInput.quantity);
            });
    });

    function checkStock(data, quantity) {
        if (data[0].stock_quantity < quantity) {
            console.log("Insufficient quantity!");
            connection.end();
        } else {
            updateDB(data, quantity);
            totalCost(data, quantity);
        }
    }

    function updateDB(data, quantity) {
        var quantity_left = data[0].stock_quantity - quantity;
        connection.query("UPDATE products SET ? WHERE ?",
            [
                { stock_quantity: quantity_left },
                { item_id: data[0].item_id }
            ],
            function (error, data) {
                if (error) throw error;
            });
    }

    function totalCost(data, quantity) {
        console.log("\n============================================================\n");
        console.log("Product : " + data[0].product_name);
        console.log("Price \t: " + data[0].price);
        console.log("Quantity :" + quantity + "\n");
        console.log("Total Cost: " + data[0].price * quantity)
        connection.end();
    }

}
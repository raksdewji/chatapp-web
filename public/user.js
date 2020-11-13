/**
 * Handles all the user end JS
 */

$(function () {
      let socket = io();

      $("form").submit(function (e) {
        e.preventDefault();
        socket.emit("chat message", $("#m").val());
        $("#m").val("");
        return false;
      });

      // Display previous sent messages for new user
      socket.on("new user", function (user) {
        for (let i = 0; i < user.log.length; i++) {
          $("#messages").append(
            $("<li>").html(
              "<div>" +
                "(" +
                user.log[i].time +
                ") " +
                '<span style="color:' +
                user.log[i].color +
                '";>' +
                user.log[i].username +
                "</span>" +
                ": " +
                user.log[i].message +
                "</div>"
            )
          );
        }

        // Checks if the cookie already exists
        if (
          document.cookie
            .split(";")
            .filter((item) => item.trim().startsWith("username=")).length
        ) {
          let cookieValue = document.cookie.replace(
            /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
            "$1"
          );
          if (checkDuplicate(cookieValue, user.onlineUsers) === true) {
            $("#username").html(user.user);
            socket.emit("online user", user.user);
          } else {
            $("#username").html(cookieValue);
            socket.emit("online user", cookieValue);
          }
        } else {
          document.cookie =
            "username=" + user.user + "; expires=Fri, 31 Dec 2999 23:59:59 GMT";
          $("#username").html(user.user);
          socket.emit("online user", user.user);
        }
      });

      socket.on("online users", function (onUsersList) {
        updateUsers(onUsersList);
      });

      socket.on("username changed", function (newName) {
        $("#username").html("<b>" + newName + "</b>");
      });

      // Display the messages, bold the message for the user that sends it
      socket.on("chat message", function (msg) {
        $("#messages").scrollTop($("#messages")[0].scrollHeight);

        if (msg.clientID === socket.id.toString()) {
          $("#messages").append(
            $("<li>").html(
              "<div>" +
                "(" +
                msg.time +
                ") " +
                '<span style="color:' +
                msg.color +
                '";>' +
                msg.username +
                "</span>" +
                ": " +
                "<b>" +
                msg.message +
                "</b>" +
                "</div>"
            )
          );
        } else {
          $("#messages").append(
            $("<li>").html(
              "<div>" +
                "(" +
                msg.time +
                ") " +
                '<span style="color:' +
                msg.color +
                '";>' +
                msg.username +
                "</span>" +
                ": " +
                msg.message +
                "</div>"
            )
          );
        }

        socket.emit("clientMessage", {
          message: msg.message,
          clientID: socket.id,
        });
      });

      socket.on("error message", function (errorMessage) {
        $("#messages").append(
          $("<li>").html(
            "<span>" +
              "<b>" +
              "<i>" +
              errorMessage +
              "</i>" +
              "</b>" +
              "</span>"
          )
        );
      });

      socket.on("update message", function (updateMessage) {
        $("#messages").append(
          $("<li>").html(
            "<span>" +
              "<b>" +
              "<i>" +
              updateMessage +
              "</i>" +
              "</b>" +
              "</span>"
          )
        );
      });

      socket.on("user disconnected", function (onUsersList) {
        updateUsers(onUsersList);
      });

      function updateUsers(userList) {
        for (let i = 0; i < userList.length; i++) {
          if (i === 0) {
            $("#users").html("<li>" + userList[i] + "</li>");
          } else {
            $("#users").append($("<li>").text(userList[i]));
          }
        }
      }

      function checkDuplicate(username, onUsersList) {
        for (let i = 0; i < onUsersList.length; i++) {
          if (onUsersList[i] === username) {
            return true;
          }
        }
        return false;
      }
    });
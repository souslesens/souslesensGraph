var authentication = (function () {

    var self = {}

    self.authenticationUrl = "../../authentication";
    self.userIndexes = [];


    self.init = function (activate) {
        var url = window.location.host;
        if (activate) {//  && url.indexOf("localhost")<0 && url.indexOf("127.0.0.1")<0){


            $("#loginDiv").css("visibility", "visible");
            $("#panels").css("visibility", "hidden");
           // $("#panels").css("display", "none")

        }

    }


    self.doLogin = function (group) {
        var login = $("#loginInput").val();
        var password = $("#passwordInput").val();
        // var match=password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/);

        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
            $("#loginMessage").html("invalid  login : Minimum eight characters, at least one uppercase letter, one lowercase letter and one number");
        }
        var payload = {
            authentify: 1,
            login: login,
            password: password

        }
        $.ajax({
            type: "POST",
            url: self.authenticationUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                if (!$.isArray(data))
                    return $("#loginMessage").html("invalid  login or password");

                else if (data.length == 0) {
                    return $("#loginMessage").html("invalid  login or password");

                }


                $("#loginDiv").css("visibility", "hidden");
                  $("#panels").css("visibility", "visible");
               // $("#panels").css("display", "block")


            }, error: function (err) {
                $("#loginMessage").html("invalid  login or password");

            }
        })

    }


    return self;
})()
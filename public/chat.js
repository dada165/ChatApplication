$(document).ready(function() {
            var socket = io();
            var cloned = $(".inbox").html();
            let users = 0;
            cloned = cloned.replace("template", "")
            $('.reg-btn').attr('disabled', true)
            var username = "anonymous";

            $("#Myusername").change(function() {
                if ($(this).val() != "") {
                    username = $(this).val();
                    socket.emit('check-username', username)
                    socket.on('verify-username', function(reply) {
                        if (reply == '1') {
                            $('.reg-btn').attr('disabled', false)
                        } else {
                            $('.reg-form').append($('<div>', {
                                class: "ui name-error pointing red basic label"
                            }).text("This username is taken!"))

                            $("#Myusername").keydown(function() {
                                $('.name-error').hide()
                            })
                        }
                    })
                }
            });


            socket.on('joined', function(user) {
                if (user == username) {
                    addActivity("You", "joined")
                } else {
                    addActivity(user, "joined")
                }
            })

            socket.on('leave', function(user) {
                addActivity(user, "left")
            })

            $('.reg-btn').click(function() {
                $("#Myusername").val("");
                $('#register').modal('hide');
                $('.btn-compose').attr('disabled', false)
                $('#username').attr('disabled', true)
                $("#username").val(username);
                socket.emit('set-online', {
                    username: username
                })
                init();
            })

            $('#register').modal('setting', 'closable', false).modal('show');


            $(document).on("keyup",".message-input",()=>{
                console.log("migana pag type")
                socket.emit("nagtype",{
                    typing:true,
                    //typing:$(this).find("message-input").val().length > 0,
                    user:username
                });
            })
            $(document).on("mouseout",".message-input",()=>{
                socket.emit("waytype",{
                    typing:false,
                    user:username
                })
            })

            //Listen on typing
            socket.on('nagtype', function(data) {
                $('.typing-note').html(data.typing?`${data.user} is typing...`:"");
            })
            socket.on('waytype', function(data) {
                $('.typing-note').html(" ");
            })
                $(document).on('click', '.sendMe', function(e) {
                    var receiver = $(this).attr("receiver").split("_")[1]
                    var message = $(this).closest("div.form-area").find("input").val();
                    if (receiver == 'gc') {
                        inbox = "#groupchat-msg"
                    } else {
                        inbox = "#" + receiver + "-msg"
                    }
                    sendMessage({
                        sender: username,
                        receiver: receiver,
                        message: message
                    }, inbox)
                    $(this).closest("div.form-area").find("input").val("")
                });

                function init() {
                    $('.item-slider').slick({
                        slidesToShow: 1,
                        slidesToScroll: 1,
                        autoplay: false
                    });

                    setTimeout(function() {
                        $('#loader').removeClass('active');
                    }, 800);
                    $(".item-slider").slick('slickAdd', cloned)
                }

                socket.on("broadcastMessage", function(msg) {
                    receiveMessage(msg)
                });


                socket.on('online', function(data) {
                    countOnline(data)
                })

                socket.on('logout', function(user) {
                    $('.count').text((users - 1))
                    $("." + user + "_class").remove()
                    $("." + user + "_online").remove()
                })

                function addActivity(user, activity) {
                    var color = 'green'
                    if (activity == 'left') {
                        color = 'red';
                    }
                    $('<p>', {
                        class: "ui item"
                    }).append("<i class = '" + color + " circle icon'></i>", $("<span>").text(user + " " + activity + " the room")).appendTo($('.my-activities'))
                }

                function sendMessage(message, inbox) {
                    socket.emit("message", message, inbox);
                    logSentMessage(message, inbox)
                }

                function logSentMessage(myMsg, inbox) {
                    var inbox;
                    $(inbox).append($('<div>', {
                        class: "ui large right pointing blue label "
                    }).css({
                        padding: '10px',
                        marginTop: '10px',
                        maxWidth: "200px",
                        wordWrap: 'break-word',
                        float: 'right'
                    }).text(myMsg.sender + " :  " + myMsg.message), '<br clear="all" />');
                    $('#myMessage').val('');
                    $('#receiver').val('');
                }

                function receiveMessage(message) {
                    var inbox = "";
                    if (message.receiver == 'gc') {
                        inbox += '#groupchat-msg'
                    } else
                    if (message.receiver == username) {
                        inbox += '#' + message.sender + "-msg"
                    }
                    if (message.sender != username) {
                        $(inbox).append($('<div>', {
                            class: "ui large left pointing teal label"
                        }).css({
                            padding: '10px',
                            marginTop: '10px',
                            maxWidth: "200px",
                            wordWrap: 'break-word'
                        }).text(message.sender + " :  " + message.message), '<br clear="all" />');
                    }
                }

                function countOnline(data) {
                    users = data.length;
                    console.log("mao ni ang mga online " + data);
                    $('.online-users').empty()
                    $('.count').text((users))
                    for (user = 0; user < data.length; user++) {
                        // if (username != data[user]) {
                        if (!$('#item-slider').has('.' + data[user] + "_class").length) {
                            var chatBox = cloned.replace("Group Chat", data[user]).replace("groupchat-msg", data[user] + "-msg").replace("receiver_gc", "receiver_" + data[user]).replace("template", "").replace("groupmsg", "private_" + data[user]).replace("message-gc", "message-" + data[user]).replace('groupclass', data[user] + "_class")
                            $(".item-slider").slick('slickAdd', chatBox)
                            $('<p>', {
                                class: "ui user item " + data[user] + "_online"
                            }).append("<i class = 'green user icon'></i>", $("<span>", {
                                    class: "user-name",
                            }).text(data[user])).appendTo($('.online-users'))
                        }
                    }
                    return;
                }
            })
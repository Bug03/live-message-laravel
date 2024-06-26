
/**
 * --------------------------------------------------------------------------
 * Global Variables
 * --------------------------------------------------------------------------
 */
var temporaryMsgId = 0;

const messageForm = $(".message-form"),
    messageInput = $(".message-input"),
    messageBoxContainer = $(".wsus__chat_area_body"),
    csrf_token = $('meta[name="csrf_token"]').attr("content");

const getMessengerId = () => $("meta[name=id]").attr("content");
const setMessengerId = (id) => $("meta[name=id]").attr("content",id);

/**
 * --------------------------------------------------------------------------
 * Resuable Messenger Component
 * --------------------------------------------------------------------------
 */

function enableChatBoxLoader() {
    $('.wsus__message_paceholder').removeClass('d-none');
}

function disableChatBoxLoader() {
    $('.wsus__message_paceholder').addClass('d-none');
}

function imagePreview(input, selector) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $(selector).attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

let searchPage = 1;
let noMoreDataSearch = false;
let searchTempVal = "";
let setSearchLoading = false;
function searchUser(query) {

    if (query != searchTempVal) {
        searchPage = 1;
        noMoreDataSearch = false;
    }
    searchTempVal = query;

    if (!setSearchLoading && !noMoreDataSearch) {
        $.ajax({
            method: 'GET',
            url: '/messenger/search',
            data: { query: query, page: searchPage },
            beforeSend: function () {
                setSearchLoading = true;
                let loader = `
                <div class="text-center search-loader">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                `
                $('.user_search_list_result').append(loader);
            },
            success: function (data) {
                setSearchLoading = false;
                $('.user_search_list_result').find('.search-loader').remove();

                if (searchPage < 2) {
                    $('.user_search_list_result').html(data.records);
                } else {
                    $('.user_search_list_result').append(data.records);
                }

                noMoreDataSearch = searchPage >= data?.last_page
                if (!noMoreDataSearch) searchPage += 1
            },
            error: function (xhr, status, error) {
                setSearchLoading = false;
                $('.user_search_list_result').find('.search-loader').remove();

            }
        })
    }
}

function actionOnScroll(selector, callback, topScroll = false) {
    $(selector).on('scroll', function () {
        let element = $(this).get(0);
        // Use Math.ceil on the sum of scrollTop and clientHeight to ensure the condition accounts for fractional values
        const condition = topScroll ? element.scrollTop === 0 :
            Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight;

        if (condition) {
            callback();
        }
    });
}

function debounce(callback, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            callback.apply(this, args);
        }, delay)
    }
}

/**
 * --------------------------------------------------------------------------
 * Fetch id data of user and update the view
 * --------------------------------------------------------------------------
 */
function IDinfo(id) {
    $.ajax({
        method: 'GET',
        url: '/messenger/id-info',
        data: { id: id },
        beforeSend: function () {
            NProgress.start();
            enableChatBoxLoader();
        },
        success: function (data) {
            $(".messenger-header").find("img").attr('src', data.user.avatar);
            $(".messenger-header").find("h4").text(data.user.name);
            $(".messenger-info-view .user_photo").find("img").attr('src', data.user.avatar);
            $(".messenger-info-view").find(".user_name").text(data.user.name);
            $(".messenger-info-view").find(".user_unique_name").text(data.user.user_name);
            NProgress.done();
            disableChatBoxLoader();
        },
        error: function (xhr, status, error) {
            console.log(xhr);
            enableChatBoxLoader();
        }
    })
}

/**
 * --------------------------------------------------------------------------
 * Send Message
 * --------------------------------------------------------------------------
 */

function sendMessage() {
    temporaryMsgId += 1;
    let tempID = `temp_${temporaryMsgId}`;
    let hasAttachment = !!$('.attachment-input').val();
    const inputValue = messageInput.val();

    if (inputValue.length > 0 || hasAttachment) {
        const formData = new FormData($(".message-form")[0]);
        formData.append("id", getMessengerId());
        formData.append("temporaryMsgId", tempID);
        formData.append("_token", csrf_token);

        $.ajax({
            method: "POST",
            url: "/messenger/send-message",
            data: formData,
            dataType: "JSON",
            processData: false,
            contentType: false,
            beforeSend: function () {
                if(hasAttachment){
                    messageBoxContainer.append(sendTempMessageCard(inputValue, tempID, true));
                }else {
                    messageBoxContainer.append(sendTempMessageCard(inputValue, tempID));
                }

                messageFormReset();
            },
            success: function (data) {
                const tempMsgCardElement = messageBoxContainer.find(`.message-card[data-id=${data.temporaryMsgId}]`);
                tempMsgCardElement.before(data.message);
                tempMsgCardElement.remove();
            },
            error: function (xhr) {

            }
        })
    }
}

function sendTempMessageCard(message, tempId, attachment = false) {
    if (attachment) {
        return `
        <div class="wsus__single_chat_area message-card" data-id="${tempId}">
            <div class="wsus__single_chat chat_right">
                <div class="pre_loader">
                    <div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                ${message.length > 0 ? `<p class="messages">${message}</p>` : ''}

                <span class="clock"><i class="fas fa-clock"></i> now</span>
            </div>
        </div>
        `
    } else {
        return `
        <div class="wsus__single_chat_area message-card" data-id="${tempId}">
            <div class="wsus__single_chat chat_right">
                <p class="messages">${message}</p>
                <span class="clock"><i class="fas fa-clock"></i> now</span>
            </div>
        </div>
        `
    }

}

// cancel selected attachment
function messageFormReset() {
    $('.attachment-block').addClass('d-none');
    messageForm.trigger("reset");
    $(".emojionearea-editor").text("");
}


/**
 * --------------------------------------------------------------------------
 * On Dom Load Event
 * --------------------------------------------------------------------------
 */

$(document).ready(function () {

    $('#select_file').change(function () {
        imagePreview(this, '.profile-img-preview');
    });

    // Search action on keyup
    const debouncedSearch = debounce(function () {
        const value = $('.user_search').val();
        searchUser(value);
    }, 500);

    $('.user_search').on('keyup', function () {
        let query = $(this).val();
        if (query.length > 0) {
            debouncedSearch();
        }
    });
    // search pagination
    actionOnScroll(".user_search_list_result", function () {
        let value = $('.user_search').val();
        searchUser(value);
    });

    // click action for message list item
    $("body").on("click", ".messenger-list-item", function () {
        const dataId  = $(this).attr('data-id');
        setMessengerId(dataId);
        IDinfo(dataId);
    });

    //Send message
    $(".message-form").on("submit", function (e) {
        e.preventDefault();
        sendMessage();
    });

    // send attachment
    $('.attachment-input').change(function () {
        imagePreview(this, '.attachment-preview');
        $('.attachment-block').removeClass('d-none');
    });

    $('.attachment-cancel').on('click', function () {
        messageFormReset();
    });


    // custom hight adjustment
    function adjustHeight() {
        var windowHeight = $(window).height();
        $('.wsus__chat_area_body').css('height', (windowHeight - 120) + 'px');
        $('.messenger-contacts').css('max-height', (windowHeight - 393) + 'px');
        $('.wsus__chat_info_gallery').css('max-height', (windowHeight - 400) + 'px');
        $('.user_search_list_result').css({
            'height': (windowHeight - 130) + 'px',
        });
    }

    // Call the function initially
    adjustHeight();

    // Call the function whenever the window is resized
    $(window).resize(function () {
        adjustHeight();
    });
});




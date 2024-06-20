/**
 * --------------------------------------------------------------------------
 * Resuable Messenger Component
 * --------------------------------------------------------------------------
 */

function imagePreview(input, selector) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            $(selector).attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
    // if (input.files) {
    //     // Duyệt qua từng file đã chọn
    //     for (let i = 0; i < input.files.length; i++) {
    //         // Lấy file hiện tại
    //         let file = input.files[i];

    //         // In thông tin của file
    //         console.log("File name: " + file.name);
    //         console.log("File size: " + file.size + " bytes");
    //         console.log("File type: " + file.type);
    //         console.log("Last modified: " + file.lastModifiedDate);
    //     }
    // }
}

/**
 * --------------------------------------------------------------------------
 * On Dom Load Event
 * --------------------------------------------------------------------------
 */

$(document).ready(function() {

    $('#select_file').change(function() {
        imagePreview(this, '.profile-img-preview');
    });
})



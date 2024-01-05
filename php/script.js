$(document).ready(function() {
    let currentPage = 1;
    let totalPages = 0;
    let currentImageIndex = -1;
    let imageUrls = [];
    let currentPath = ''; // Keep track of the current path

    $('#backButton').hide(); // Initially hide the button

    $('#sortButton').click(function() {
        loadImages(currentPage);
    });

    $('#sortAsc').click(function() {
        $('#sortOrder').val('asc');
        loadImages(currentPage);
        updateSortButtonHighlight(this);
    });

    $('#sortDesc').click(function() {
        $('#sortOrder').val('desc');
        loadImages(currentPage);
        updateSortButtonHighlight(this);
    });

    function loadImages(page, subdir = '') {
        let sortField = $('#sortField').val();
        let sortOrder = $('#sortOrder').val();

        $('#loadingOverlay').show();

        $.getJSON(`imageLoader.php?page=${page}&subdir=${currentPath}&sort=${sortField}&order=${sortOrder}`, function(response) {
            imageUrls = [];
            // Clear previous content
            $('#imageGallery').empty();
            $('#imageGallery').append('<div id="subdirList" class="mb-4"></div>'); // Sub-directory section
            $('#imageGallery').append('<div id="imageList" class="row"></div>'); // Image thumbnails section
            $('#modalImage').attr('src', '#');

            // Display sub-directories
            if (response.subdirectories && response.subdirectories.length > 0) {
                response.subdirectories.forEach(function(dir) {
                    let subdirLink = $('<a>').attr('href', '#').text(dir).addClass('subdir-link btn btn-outline-primary btn-sm m-1').attr('data-subdir', dir);
                    $('#subdirList').append(subdirLink);
                });
            }

            // Hide or Show Sorting Controls based on the number of images
            if (response.images && response.images.length > 0) {
                $('#sortingControlsContainer').show();
                $('.pagination').show();
            } else {
                $('#sortingControlsContainer').hide();
                $('.pagination').hide();
            }

            response.images.forEach(function(imageUrl) {
                imageUrls.push(imageUrl);
                let col = $('<div class="col-lg-2 col-md-4 col-sm-6 mb-4">');
                let img = $('<img>').attr('src', imageUrl.thumbnail).addClass('img-thumbnail');
                img.attr('fullsrc', imageUrl.fullsize);
                col.append(img);
                // $('#imageGallery').append(col);
                $('#imageList').append(col);
            });

            totalPages = response.totalPages;
            updatePagination(page);
            saveCurrentPath();
            if(currentPath !== '') {
                $('#currentDirectory').text('Current Directory: ' + currentPath);
            } else {
                $('#currentDirectory').text('');
            }
            $('#loadingOverlay').hide(); // Hide the loading icon after images are loaded
            // Update current directory display
        });
    }

    function updatePagination(page) {
        currentPage = page;
        let pagination = $('.pagination');
        pagination.find('.page-item').not('#firstPage, #previousPage, #nextPage, #lastPage').remove();

        let startPage = Math.max(1, page - 3);
        let endPage = Math.min(page + 3, totalPages);

        for (let i = startPage; i <= endPage; i++) {
            let pageItem = $('<li class="page-item">').append($('<a class="page-link">').text(i).attr('href', '#'));
            if (i === page) pageItem.addClass('active');
            $('#nextPage').before(pageItem);
        }

        $('#firstPage, #previousPage').toggleClass('disabled', page === 1);
        $('#nextPage, #lastPage').toggleClass('disabled', page === totalPages);
    }

    function updateModalImage(index) {
        if (index >= 0 && index < imageUrls.length) {
            currentImageIndex = index;
            let thumbnailUrl = imageUrls[index].thumbnail;
            let fullImageUrl = imageUrls[index].fullsize;

            $('#modalImage').attr('src', fullImageUrl);
            $('#fullSizeLink').attr('href', fullImageUrl);
            $('#prevImage').prop('disabled', index === 0);
            $('#nextImage').prop('disabled', index === imageUrls.length - 1);
        }
    }

    // Image thumbnail click event
    $('#imageGallery').on('click', '.img-thumbnail', function() {
        let index = $('.img-thumbnail').index(this);
        updateModalImage(index);
        $('#imageModal').modal('show');
    });

    // When a subdirectory link is clicked
    $('#imageGallery').on('click', '.subdir-link', function(e) {
        e.preventDefault();
        let subdir = $(this).attr('data-subdir');
        currentPath = currentPath + '/' + subdir
        loadImages(1, currentPath);
        if(subdir != '') {
            $('#backButton').show(); // Show the back button
        }
    });

    // Event when the modal is closed
    $('#imageModal').on('hidden.bs.modal', function () {
        // Clear the src attribute of the modal image
        $('#modalImage').attr('src', '');
    });

    // Next and Previous button events
    $('#nextImage').click(function() {
        updateModalImage(currentImageIndex + 1);
    });

    $('#prevImage').click(function() {
        updateModalImage(currentImageIndex - 1);
    });

    // Pagination control clicks
    $('.pagination').on('click', '.page-link', function(e) {
        e.preventDefault();
        let newPage = $(this).text();

        switch (newPage) {
            case 'First': newPage = 1; break;
            case 'Previous': newPage = Math.max(1, currentPage - 1); break;
            case 'Next': newPage = Math.min(totalPages, currentPage + 1); break;
            case 'Last': newPage = totalPages; break;
            default: newPage = parseInt(newPage);
        }

        if (newPage !== currentPage) {
            loadImages(newPage);
        }
    });

    // Function to save the current path in localStorage
    function saveCurrentPath() {
        if (typeof(Storage) !== 'undefined') {
            localStorage.setItem('currentPath', currentPath);
        }
    }

    // Function to load the current path from localStorage
    function loadCurrentPath() {
        if (typeof(Storage) !== 'undefined') {
            return localStorage.getItem('currentPath') || '';
        }
        return '';
    }

    function updateSortButtonHighlight(activeButton) {
        // Remove active-sort class from both buttons
        $('#sortAsc, #sortDesc').removeClass('active-sort');

        // Add active-sort class to the clicked button
        $(activeButton).addClass('active-sort');
    }

    // Initial load
    $('#backButton').hide().click(function() {
        let pathArray = currentPath.split('/');
        pathArray.pop(); // Remove the last part of the path
        currentPath = pathArray.join('/');
        loadImages(1, currentPath);
        if (currentPath === '') {
            $(this).hide(); // Hide the button if in the base directory
        }
    });

    let initialSortOrder = $('#sortOrder').val();
    if (initialSortOrder === 'asc') {
        updateSortButtonHighlight('#sortAsc');
    } else {
        updateSortButtonHighlight('#sortDesc');
    }

    let savedPath = loadCurrentPath();
    if (savedPath !== '') {
        $('#backButton').show();
    }
    currentPath = savedPath;
    loadImages(currentPage, savedPath);
});


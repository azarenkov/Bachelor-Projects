let currentHotelId = null;
let currentRoomForBooking = null;

async function loadFeaturedHotels() {
    try {
        const hotels = await api.getAllHotels();
        displayHotels(hotels, 'featuredHotels', true);
    } catch (error) {
        document.getElementById('featuredHotels').innerHTML = '<div class="empty-state"><p>Failed to load hotels</p></div>';
    }
}

async function loadAllHotels() {
    try {
        const hotels = await api.getAllHotels();
        displayHotels(hotels, 'hotelsList');
    } catch (error) {
        document.getElementById('hotelsList').innerHTML = '<div class="empty-state"><p>Failed to load hotels</p></div>';
    }
}

async function searchHotels(city, minRating = null) {
    try {
        const hotels = await api.searchHotels(city, minRating);
        displayHotels(hotels, 'hotelsList');
        if (hotels.length === 0) {
            document.getElementById('hotelsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏨</div>
                    <h3>No hotels found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('hotelsList').innerHTML = '<div class="empty-state"><p>Search failed</p></div>';
    }
}

function displayHotels(hotels, containerId, featured = false) {
    const container = document.getElementById(containerId);

    if (!hotels || hotels.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏨</div>
                <h3>No hotels available</h3>
                <p>Check back soon for new listings</p>
            </div>
        `;
        return;
    }

    const hotelsToShow = featured ? hotels.slice(0, 6) : hotels;

    container.innerHTML = hotelsToShow.map(hotel => `
        <div class="hotel-card" data-hotel-id="${hotel.id}">
            <div class="hotel-image">
                ${hotel.name.charAt(0).toUpperCase()}
            </div>
            <div class="hotel-content">
                <div class="hotel-header">
                    <div>
                        <h3 class="hotel-name">${escapeHtml(hotel.name)}</h3>
                        <div class="hotel-location">
                            📍 ${escapeHtml(hotel.city)}, ${escapeHtml(hotel.address)}
                        </div>
                    </div>
                    ${hotel.rating > 0 ? `
                        <div class="hotel-rating">
                            ⭐ ${hotel.rating.toFixed(1)}
                        </div>
                    ` : ''}
                </div>
                ${hotel.description ? `
                    <p class="hotel-description">${escapeHtml(hotel.description)}</p>
                ` : ''}
                ${hotel.rooms && hotel.rooms.length > 0 ? `
                    <div style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        ${hotel.rooms.length} room${hotel.rooms.length > 1 ? 's' : ''} available
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.hotel-card').forEach(card => {
        card.addEventListener('click', () => {
            const hotelId = card.dataset.hotelId;
            viewHotelDetails(hotelId);
        });
    });
}

async function viewHotelDetails(hotelId) {
    currentHotelId = hotelId;
    navigateToPage('hotelDetails');

    const container = document.getElementById('hotelDetails');
    container.innerHTML = '<div class="loading">Loading hotel details...</div>';

    try {
        const hotel = await api.getHotel(hotelId);
        displayHotelDetails(hotel);
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Failed to load hotel details</p></div>';
        showToast('Failed to load hotel details', 'error');
    }
}

function displayHotelDetails(hotel) {
    const container = document.getElementById('hotelDetails');

    container.innerHTML = `
        <div class="hotel-details-container">
            <div class="hotel-details-header">
                <h1>${escapeHtml(hotel.name)}</h1>
                <div class="hotel-location" style="color: rgba(255,255,255,0.9); font-size: 1.1rem; margin-top: 0.5rem;">
                    📍 ${escapeHtml(hotel.city)}, ${escapeHtml(hotel.address)}
                </div>
                ${hotel.rating > 0 ? `
                    <div class="hotel-rating" style="color: #fbbf24; font-size: 1.5rem; margin-top: 1rem;">
                        ⭐ ${hotel.rating.toFixed(1)} / 5.0
                    </div>
                ` : ''}
            </div>
            <div class="hotel-details-body">
                ${hotel.description ? `
                    <div style="margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 0.75rem;">About this hotel</h3>
                        <p style="color: var(--text-secondary); line-height: 1.8;">${escapeHtml(hotel.description)}</p>
                    </div>
                ` : ''}

                <div class="rooms-section">
                    <h3>Available Rooms</h3>
                    <div id="roomsList">
                        ${hotel.rooms && hotel.rooms.length > 0 ?
                            hotel.rooms.map(room => createRoomCard(room, hotel)).join('') :
                            '<div class="empty-state"><div class="empty-state-icon">🚪</div><h3>No rooms available</h3></div>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.book-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const roomId = btn.dataset.roomId;
            const room = hotel.rooms.find(r => r.id == roomId);
            openBookingModal(hotel, room);
        });
    });
}

function createRoomCard(room, hotel) {
    return `
        <div class="room-card">
            <div class="room-header">
                <div>
                    <div class="room-number">Room ${escapeHtml(room.room_number)}</div>
                    <div class="room-type">${escapeHtml(room.type)}</div>
                </div>
                <div style="text-align: right;">
                    <div class="room-price">$${room.price_per_day}</div>
                    <div class="room-price-label">per night</div>
                </div>
            </div>
            ${room.description ? `
                <p style="color: var(--text-secondary); margin: 0.75rem 0;">${escapeHtml(room.description)}</p>
            ` : ''}
            <div class="room-details">
                <div class="room-detail-item">
                    👥 ${room.capacity} guest${room.capacity > 1 ? 's' : ''}
                </div>
                <div class="room-detail-item">
                    ${room.available ?
                        '<span class="badge badge-success">Available</span>' :
                        '<span class="badge badge-danger">Not Available</span>'
                    }
                </div>
            </div>
            ${room.available && api.isAuthenticated() ? `
                <button class="btn btn-primary book-room-btn" data-room-id="${room.id}">
                    Book Now
                </button>
            ` : !api.isAuthenticated() ? `
                <button class="btn btn-outline" onclick="openAuthModal(false)">
                    Login to Book
                </button>
            ` : ''}
        </div>
    `;
}

function openBookingModal(hotel, room) {
    if (!api.isAuthenticated()) {
        openAuthModal(false);
        return;
    }

    currentRoomForBooking = { hotel, room };
    const modal = document.getElementById('bookingModal');
    const form = document.getElementById('bookingForm');

    form.elements.hotel_id.value = hotel.id;
    form.elements.room_id.value = room.id;

    const today = new Date().toISOString().split('T')[0];
    form.elements.check_in.min = today;
    form.elements.check_in.value = today;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    form.elements.check_out.min = tomorrow.toISOString().split('T')[0];
    form.elements.check_out.value = tomorrow.toISOString().split('T')[0];

    document.getElementById('bookingSummary').innerHTML = `
        <div style="background: var(--bg-light); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem;">${escapeHtml(hotel.name)}</h4>
            <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${escapeHtml(room.type)} - Room ${escapeHtml(room.room_number)}</p>
            <p style="font-weight: 700; color: var(--primary-color);">$${room.price_per_day} per night</p>
        </div>
    `;

    updatePriceEstimate();

    modal.classList.add('active');
}

function updatePriceEstimate() {
    if (!currentRoomForBooking) return;

    const form = document.getElementById('bookingForm');
    const checkIn = form.elements.check_in.value;
    const checkOut = form.elements.check_out.value;
    const priceEstimate = document.getElementById('priceEstimate');

    if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (days > 0) {
            const total = days * currentRoomForBooking.room.price_per_day;
            priceEstimate.innerHTML = `
                <div class="price-estimate-row">
                    <span>${days} night${days > 1 ? 's' : ''}</span>
                    <span>$${currentRoomForBooking.room.price_per_day} × ${days}</span>
                </div>
                <div class="price-estimate-row price-estimate-total">
                    <span>Total</span>
                    <span>$${total}</span>
                </div>
            `;
        } else {
            priceEstimate.innerHTML = '';
        }
    }
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const city = document.getElementById('searchCity').value;
    const checkIn = document.getElementById('searchCheckIn').value;
    const checkOut = document.getElementById('searchCheckOut').value;

    if (city) {
        navigateToPage('hotels');
        searchHotels(city);
    } else {
        showToast('Please enter a city', 'warning');
    }
});

document.getElementById('filterCity').addEventListener('input', (e) => {
    const city = e.target.value;
    const rating = document.getElementById('filterRating').value;
    if (city || rating) {
        searchHotels(city, rating);
    } else {
        loadAllHotels();
    }
});

document.getElementById('filterRating').addEventListener('change', (e) => {
    const city = document.getElementById('filterCity').value;
    const rating = e.target.value;
    searchHotels(city, rating);
});

document.querySelectorAll('.destination-card').forEach(card => {
    card.addEventListener('click', () => {
        const city = card.dataset.city;
        document.getElementById('searchCity').value = city;
        navigateToPage('hotels');
        searchHotels(city);
    });
});

document.getElementById('backToHotels').addEventListener('click', () => {
    navigateToPage('hotels');
});

const bookingForm = document.getElementById('bookingForm');
bookingForm.elements.check_in.addEventListener('change', updatePriceEstimate);
bookingForm.elements.check_out.addEventListener('change', updatePriceEstimate);

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const bookingData = {
        hotel_id: parseInt(formData.get('hotel_id')),
        room_id: parseInt(formData.get('room_id')),
        check_in: formData.get('check_in'),
        check_out: formData.get('check_out')
    };

    try {
        await api.createBooking(bookingData);
        showToast('Booking created successfully!', 'success');
        document.getElementById('bookingModal').classList.remove('active');
        bookingForm.reset();
        navigateToPage('bookings');
        loadMyBookings();
    } catch (error) {
        showToast(error.message || 'Failed to create booking', 'error');
    }
});

loadFeaturedHotels();

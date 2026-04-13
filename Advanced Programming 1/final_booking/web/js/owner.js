let currentEditHotel = null;
let currentEditRoom = null;

async function loadOwnerDashboard() {
    if (!api.isAuthenticated()) {
        document.getElementById('ownerHotelsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <h3>Please login to access dashboard</h3>
                <button class="btn btn-primary" onclick="openAuthModal(false)">Login</button>
            </div>
        `;
        return;
    }

    loadOwnerHotels();
}

async function loadOwnerHotels() {
    const container = document.getElementById('ownerHotelsList');
    container.innerHTML = '<div class="loading">Loading your hotels...</div>';

    try {
        const hotels = await api.getMyHotels();
        displayOwnerHotels(hotels);
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Failed to load hotels</p></div>';
        showToast('Failed to load hotels', 'error');
    }
}

function displayOwnerHotels(hotels) {
    const container = document.getElementById('ownerHotelsList');

    if (!hotels || hotels.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏨</div>
                <h3>No hotels yet</h3>
                <p>Create your first hotel to start receiving bookings</p>
                <button class="btn btn-primary" onclick="openHotelModal()">Add Hotel</button>
            </div>
        `;
        return;
    }

    container.innerHTML = hotels.map(hotel => `
        <div class="owner-hotel-card">
            <div class="owner-hotel-header">
                <div>
                    <h3>${escapeHtml(hotel.name)}</h3>
                    <p style="color: var(--text-secondary); margin: 0.5rem 0;">
                        📍 ${escapeHtml(hotel.city)}, ${escapeHtml(hotel.address)}
                    </p>
                    ${hotel.description ? `
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">${escapeHtml(hotel.description)}</p>
                    ` : ''}
                    ${hotel.rating > 0 ? `
                        <div class="hotel-rating" style="margin-top: 0.5rem;">
                            ⭐ ${hotel.rating.toFixed(1)}
                        </div>
                    ` : ''}
                </div>
                <div class="hotel-actions">
                    <button class="btn btn-outline btn-sm" onclick="editHotel(${hotel.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteHotel(${hotel.id})">Delete</button>
                </div>
            </div>

            <div class="rooms-list">
                <h4>
                    <span>Rooms (${hotel.rooms?.length || 0})</span>
                    <button class="btn btn-primary btn-sm" onclick="openRoomModal(${hotel.id})">+ Add Room</button>
                </h4>
                ${hotel.rooms && hotel.rooms.length > 0 ?
                    hotel.rooms.map(room => `
                        <div class="owner-room-card">
                            <div class="room-info">
                                <strong>Room ${escapeHtml(room.room_number)}</strong> - ${escapeHtml(room.type)}
                                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem;">
                                    💰 $${room.price_per_day}/night | 👥 ${room.capacity} guests |
                                    ${room.available ?
                                        '<span class="badge badge-success">Available</span>' :
                                        '<span class="badge badge-danger">Unavailable</span>'
                                    }
                                </div>
                            </div>
                            <div class="room-actions">
                                <button class="btn btn-outline btn-sm" onclick="editRoom(${hotel.id}, ${room.id})">Edit</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteRoom(${room.id})">Delete</button>
                            </div>
                        </div>
                    `).join('') :
                    '<p style="color: var(--text-secondary); padding: 1rem;">No rooms added yet</p>'
                }
            </div>
        </div>
    `).join('');
}

function openHotelModal(hotel = null) {
    currentEditHotel = hotel;
    const modal = document.getElementById('hotelModal');
    const form = document.getElementById('hotelForm');
    const title = document.getElementById('hotelModalTitle');

    if (hotel) {
        title.textContent = 'Edit Hotel';
        form.elements.hotelId.value = hotel.id;
        form.elements.name.value = hotel.name;
        form.elements.city.value = hotel.city;
        form.elements.address.value = hotel.address;
        form.elements.description.value = hotel.description || '';
    } else {
        title.textContent = 'Add Hotel';
        form.reset();
    }

    modal.classList.add('active');
}

async function editHotel(hotelId) {
    try {
        const hotel = await api.getHotel(hotelId);
        openHotelModal(hotel);
    } catch (error) {
        showToast('Failed to load hotel details', 'error');
    }
}

async function deleteHotel(hotelId) {
    if (!confirm('Are you sure you want to delete this hotel? All rooms and bookings will be deleted.')) {
        return;
    }

    try {
        await api.deleteHotel(hotelId);
        showToast('Hotel deleted successfully', 'success');
        loadOwnerHotels();
    } catch (error) {
        showToast(error.message || 'Failed to delete hotel', 'error');
    }
}

function openRoomModal(hotelId, room = null) {
    currentEditRoom = room;
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('roomModalTitle');

    form.elements.hotelId.value = hotelId;

    if (room) {
        title.textContent = 'Edit Room';
        form.elements.roomId.value = room.id;
        form.elements.room_number.value = room.room_number;
        form.elements.type.value = room.type;
        form.elements.price_per_day.value = room.price_per_day;
        form.elements.capacity.value = room.capacity;
        form.elements.description.value = room.description || '';
        form.elements.available.checked = room.available;
    } else {
        title.textContent = 'Add Room';
        form.reset();
        form.elements.hotelId.value = hotelId;
        form.elements.available.checked = true;
    }

    modal.classList.add('active');
}

async function editRoom(hotelId, roomId) {
    try {
        const room = await api.getRoom(roomId);
        openRoomModal(hotelId, room);
    } catch (error) {
        showToast('Failed to load room details', 'error');
    }
}

async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) {
        return;
    }

    try {
        await api.deleteRoom(roomId);
        showToast('Room deleted successfully', 'success');
        loadOwnerHotels();
    } catch (error) {
        showToast(error.message || 'Failed to delete room', 'error');
    }
}

async function loadHotelBookings() {
    const container = document.getElementById('hotelBookingsList');
    container.innerHTML = '<div class="loading">Loading bookings...</div>';

    try {
        const hotels = await api.getMyHotels();

        if (!hotels || hotels.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏨</div>
                    <h3>No hotels yet</h3>
                    <p>Add a hotel to start receiving bookings</p>
                </div>
            `;
            return;
        }

        const allBookings = [];
        for (const hotel of hotels) {
            try {
                const bookings = await api.getHotelBookings(hotel.id);
                allBookings.push(...bookings.map(b => ({ ...b, hotelName: hotel.name })));
            } catch (error) {
                console.error(`Failed to load bookings for hotel ${hotel.id}`, error);
            }
        }

        displayHotelBookings(allBookings);
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Failed to load bookings</p></div>';
        showToast('Failed to load bookings', 'error');
    }
}

function displayHotelBookings(bookings) {
    const container = document.getElementById('hotelBookingsList');

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No bookings yet</h3>
                <p>Your bookings will appear here</p>
            </div>
        `;
        return;
    }

    bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <div class="booking-info">
                    <h3>${escapeHtml(booking.hotelName || booking.hotel?.name || 'Hotel')}</h3>
                    <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                        ${escapeHtml(booking.room?.type || 'Room')} - Room ${escapeHtml(booking.room?.room_number || '')}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        Guest: ${escapeHtml(booking.user?.name || 'Unknown')} (${escapeHtml(booking.user?.email || '')})
                    </p>
                </div>
                <div>
                    ${getStatusBadge(booking.status)}
                </div>
            </div>
            <div class="booking-dates">
                <div class="booking-date-item">
                    <div class="booking-date-label">Check-in</div>
                    <div class="booking-date-value">${formatDate(booking.check_in)}</div>
                </div>
                <div class="booking-date-item">
                    <div class="booking-date-label">Check-out</div>
                    <div class="booking-date-value">${formatDate(booking.check_out)}</div>
                </div>
                <div class="booking-date-item">
                    <div class="booking-date-label">Total Price</div>
                    <div class="booking-date-value" style="color: var(--primary-color);">$${booking.total_price}</div>
                </div>
            </div>
            ${booking.status === 'pending' ? `
                <div class="booking-actions">
                    <button class="btn btn-success btn-sm" onclick="updateBookingStatus(${booking.id}, 'confirmed')">
                        Confirm Booking
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="updateBookingStatus(${booking.id}, 'cancelled')">
                        Reject
                    </button>
                </div>
            ` : booking.status === 'confirmed' ? `
                <div class="booking-actions">
                    <button class="btn btn-outline btn-sm" onclick="updateBookingStatus(${booking.id}, 'completed')">
                        Mark as Completed
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function updateBookingStatus(bookingId, status) {
    try {
        await api.updateBookingStatus(bookingId, status);
        showToast('Booking status updated successfully', 'success');
        loadHotelBookings();
    } catch (error) {
        showToast(error.message || 'Failed to update booking status', 'error');
    }
}

document.getElementById('addHotelBtn').addEventListener('click', () => openHotelModal());

document.getElementById('hotelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const hotelId = formData.get('hotelId');

    const hotelData = {
        name: formData.get('name'),
        city: formData.get('city'),
        address: formData.get('address'),
        description: formData.get('description')
    };

    try {
        if (hotelId) {
            await api.updateHotel(hotelId, hotelData);
            showToast('Hotel updated successfully', 'success');
        } else {
            await api.createHotel(hotelData);
            showToast('Hotel created successfully', 'success');
        }

        document.getElementById('hotelModal').classList.remove('active');
        e.target.reset();
        loadOwnerHotels();
    } catch (error) {
        showToast(error.message || 'Failed to save hotel', 'error');
    }
});

document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roomId = formData.get('roomId');
    const hotelId = formData.get('hotelId');

    const roomData = {
        room_number: formData.get('room_number'),
        type: formData.get('type'),
        price_per_day: parseInt(formData.get('price_per_day')),
        capacity: parseInt(formData.get('capacity')),
        description: formData.get('description'),
        available: formData.get('available') === 'on'
    };

    try {
        if (roomId) {
            await api.updateRoom(roomId, roomData);
            showToast('Room updated successfully', 'success');
        } else {
            await api.createRoom(hotelId, roomData);
            showToast('Room created successfully', 'success');
        }

        document.getElementById('roomModal').classList.remove('active');
        e.target.reset();
        loadOwnerHotels();
    } catch (error) {
        showToast(error.message || 'Failed to save room', 'error');
    }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');

        if (tabName === 'hotelBookings') {
            loadHotelBookings();
        }
    });
});

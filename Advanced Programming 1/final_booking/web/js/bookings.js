async function loadMyBookings() {
    const container = document.getElementById('bookingsList');
    container.innerHTML = '<div class="loading">Loading your bookings...</div>';

    if (!api.isAuthenticated()) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <h3>Please login to view your bookings</h3>
                <button class="btn btn-primary" onclick="openAuthModal(false)">Login</button>
            </div>
        `;
        return;
    }

    try {
        const bookings = await api.getMyBookings();
        displayBookings(bookings);
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>Failed to load bookings</p></div>';
        showToast('Failed to load bookings', 'error');
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No bookings yet</h3>
                <p>Start exploring hotels and make your first booking!</p>
                <button class="btn btn-primary" onclick="navigateToPage('hotels')">Browse Hotels</button>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <div class="booking-info">
                    <h3>${escapeHtml(booking.hotel?.name || 'Hotel')}</h3>
                    <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                        ${escapeHtml(booking.room?.type || 'Room')} - Room ${escapeHtml(booking.room?.room_number || '')}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        📍 ${escapeHtml(booking.hotel?.city || '')}
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
            ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
                <div class="booking-actions">
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">
                        Cancel Booking
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge badge-warning">Pending</span>',
        confirmed: '<span class="badge badge-success">Confirmed</span>',
        cancelled: '<span class="badge badge-danger">Cancelled</span>',
        completed: '<span class="badge badge-primary">Completed</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        await api.cancelBooking(bookingId);
        showToast('Booking cancelled successfully', 'success');
        loadMyBookings();
    } catch (error) {
        showToast(error.message || 'Failed to cancel booking', 'error');
    }
}

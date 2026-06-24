/* ==========================================================================
   Raven — Campus Transit Platform — Consumer App Engine
   Simulates Seat-Locking, Cashless Wallet Payments, and Smart Return Alerts
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. State Variables for Simulator
    let walletBalance = 1500;
    let selectedSeat = null;
    let countdownInterval = null;
    let countdownSeconds = 120;
    let isReverseTripAvailable = false;
    let reverseTripCountdown = 480; // 8 minutes in seconds
    let reverseTimerInterval = null;

    // Seat definition: 12 seats total. Pre-booked/taken: 2, 6, 9
    const initialBookedSeats = [2, 6, 9];
    let seatsState = {};
    for (let i = 1; i <= 12; i++) {
        seatsState[i] = initialBookedSeats.includes(i) ? 'booked' : 'available';
    }

    // DOM References
    const seatGridElement = document.getElementById('interactive-seat-grid');
    const walletBalanceElement = document.getElementById('wallet-balance-val');
    const btnFundElement = document.getElementById('btn-fund-wallet');
    const btnConfirmElement = document.getElementById('btn-confirm-booking');
    const statusTextElement = document.getElementById('booking-status-txt');
    const timerElement = document.getElementById('countdown-timer-val');
    const timerContainer = document.getElementById('countdown-timer-container');
    const terminalBody = document.getElementById('terminal-log-body');
    const btnSimulateFull = document.getElementById('btn-simulate-full');
    const reverseAlertCard = document.getElementById('reverse-alert');
    const reverseTimerVal = document.getElementById('reverse-timer-val');
    const btnPrebook = document.getElementById('btn-prebook-reverse');

    // Popup Modal Elements
    const ticketModal = document.getElementById('ticket-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    const modalTitleText = document.getElementById('modal-title-text');
    const modalMessageText = document.getElementById('modal-message-text');
    const ticketCodeVal = document.getElementById('ticket-code-val');
    const ticketSeatVal = document.getElementById('ticket-seat-val');
    const ticketRouteName = document.getElementById('ticket-route-name');
    const ticketViewContainer = document.getElementById('ticket-view-container');

    // 3. Activity Feed Logger Helper (Consumer-Friendly Logs)
    function logToActivityFeed(message, type = 'info') {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `[${hrs}:${mins}:${secs}]`;
        
        let iconPrefix = '';
        if (type === 'success') iconPrefix = 'Success: ';
        if (type === 'warn') iconPrefix = 'Warning: ';
        if (type === 'in') iconPrefix = 'Shuttle: ';
        if (type === 'out') iconPrefix = 'Wallet: ';
        
        const line = document.createElement('div');
        line.className = `log-line event-${type}`;
        line.innerHTML = `<span class="timestamp">${timestamp}</span><span>${iconPrefix}${message}</span>`;
        
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // Initial logs for the passenger dashboard
    logToActivityFeed('Raven smart transit system online.', 'success');
    logToActivityFeed('Checking Route status: Main Gate ↔ Senate Building...', 'info');
    
    setTimeout(() => {
        logToActivityFeed('Connected! Shuttle sh_KQ07 is active on Route A.', 'in');
        logToActivityFeed('9 seats open. Select a free seat above to reserve yours!', 'success');
    }, 800);

    // Custom Modal Dialog Functions
    function showTicketPopup(title, message, ticketCode, seatName, routeName = 'ROUTE A', showTicket = true) {
        modalTitleText.textContent = title;
        modalMessageText.textContent = message;
        
        if (showTicket) {
            ticketViewContainer.style.display = 'block';
            ticketCodeVal.textContent = ticketCode;
            ticketSeatVal.textContent = seatName;
            ticketRouteName.textContent = routeName;
        } else {
            ticketViewContainer.style.display = 'none';
        }
        
        ticketModal.classList.add('active');
        logToActivityFeed(`Ticket Popup displayed: ${ticketCode}`, 'success');
    }

    function hideTicketPopup() {
        ticketModal.classList.remove('active');
        logToActivityFeed('Ticket Popup closed.', 'info');
    }

    modalCloseBtn.addEventListener('click', hideTicketPopup);
    modalOkBtn.addEventListener('click', hideTicketPopup);
    ticketModal.addEventListener('click', (e) => {
        if (e.target === ticketModal) {
            hideTicketPopup();
        }
    });

    // 4. Initialize Seat Grid
    function renderSeats() {
        seatGridElement.innerHTML = '';
        // Create 12 seats, inserting an aisle in each row (column 3)
        let seatNum = 1;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                if (col === 2) {
                    // Aisle
                    const aisle = document.createElement('div');
                    aisle.className = 'seat-aisle';
                    aisle.textContent = 'AISLE';
                    seatGridElement.appendChild(aisle);
                } else {
                    const currentSeat = seatNum;
                    const seat = document.createElement('div');
                    seat.className = 'seat';
                    seat.id = `seat-${currentSeat}`;
                    
                    const state = seatsState[currentSeat];
                    if (state === 'booked') {
                        seat.classList.add('booked');
                        seat.innerHTML = `${currentSeat}<span>Taken</span>`;
                    } else if (state === 'locked') {
                        seat.classList.add('locked');
                        seat.innerHTML = `${currentSeat}<span>Your Lock</span>`;
                    } else {
                        seat.innerHTML = `${currentSeat}<span>Free</span>`;
                    }

                    // Add Click Handler
                    seat.addEventListener('click', () => handleSeatClick(currentSeat));
                    
                    seatGridElement.appendChild(seat);
                    seatNum++;
                }
            }
        }
    }

    // 5. Handle Seat Clicking
    function handleSeatClick(seatNumber) {
        if (seatsState[seatNumber] === 'booked') {
            logToActivityFeed(`Seat ${seatNumber} is already occupied by another passenger.`, 'warn');
            return;
        }

        // If clicking a locked seat, release it
        if (seatsState[seatNumber] === 'locked') {
            releaseActiveLock();
            return;
        }

        // Release prior lock if any
        if (selectedSeat !== null) {
            releaseActiveLock(true);
        }

        // Lock new seat
        selectedSeat = seatNumber;
        seatsState[seatNumber] = 'locked';
        renderSeats();

        // Log visual lock reserve
        logToActivityFeed(`You reserved Seat ${seatNumber}! We are holding it for you.`, 'in');
        logToActivityFeed(`Seat ${seatNumber} is temporarily locked for 2 minutes to prevent double-booking.`, 'success');

        // Update UI
        statusTextElement.innerHTML = `Selected Seat: <span class="booking-status-value holding">Seat ${seatNumber} - Held</span>`;
        startCountdown();
    }

    // Release Active Lock
    function releaseActiveLock(silent = false) {
        if (selectedSeat === null) return;
        
        const oldSeat = selectedSeat;
        seatsState[oldSeat] = 'available';
        selectedSeat = null;
        
        clearInterval(countdownInterval);
        timerContainer.classList.add('hidden');
        
        renderSeats();

        if (!silent) {
            logToActivityFeed(`You cancelled your reservation for Seat ${oldSeat}.`, 'info');
            logToActivityFeed(`Seat ${oldSeat} is now open and available for other riders.`, 'success');
            statusTextElement.innerHTML = `Selected Seat: <span class="booking-status-value idle">None</span>`;
        }
    }

    // 6. Start 2-minute Countdown
    function startCountdown() {
        clearInterval(countdownInterval);
        countdownSeconds = 120;
        timerContainer.classList.remove('hidden');
        timerElement.textContent = formatTime(countdownSeconds);

        countdownInterval = setInterval(() => {
            countdownSeconds--;
            timerElement.textContent = formatTime(countdownSeconds);

            if (countdownSeconds <= 0) {
                clearInterval(countdownInterval);
                logToActivityFeed(`Hold expired! Your reservation for Seat ${selectedSeat} has timed out.`, 'warn');
                logToActivityFeed(`Seat ${selectedSeat} has been released back to the open pool.`, 'info');
                
                seatsState[selectedSeat] = 'available';
                selectedSeat = null;
                timerContainer.classList.add('hidden');
                statusTextElement.innerHTML = `Selected Seat: <span class="booking-status-value idle">None</span>`;
                renderSeats();
            }
        }, 1000);
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    // 7. Confirm Seat Booking
    btnConfirmElement.addEventListener('click', () => {
        if (selectedSeat === null) {
            alert('Please tap and reserve an available seat first.');
            return;
        }

        if (walletBalance < 500) {
            logToActivityFeed('Booking failed: Insufficient wallet balance.', 'warn');
            alert('Insufficient balance. Please fund your wallet by ₦1,000 first.');
            return;
        }

        // Process Booking
        const bookedSeat = selectedSeat;
        clearInterval(countdownInterval);
        timerContainer.classList.add('hidden');
        
        walletBalance -= 500;
        walletBalanceElement.textContent = `₦${walletBalance.toLocaleString()}`;
        
        seatsState[bookedSeat] = 'booked';
        selectedSeat = null;
        
        renderSeats();

        logToActivityFeed(`Processing secure cashless payment of ₦500...`, 'out');
        
        statusTextElement.innerHTML = `Selected Seat: <span class="booking-status-value confirmed">Seat ${bookedSeat} - Booked!</span>`;

        setTimeout(() => {
            logToActivityFeed(`Payment successful! ₦500 deducted from your digital wallet.`, 'success');
            logToActivityFeed(`Electronic Ticket TKT-KQ07-${1000 + bookedSeat} generated successfully!`, 'success');
            logToActivityFeed(`Seat ${bookedSeat} is now permanently secured. Have a great trip!`, 'in');
            
            showTicketPopup(
                'Booking Confirmed!',
                'Your digital ticket has been generated. Show the pass details below to the driver upon boarding.',
                `TKT-KQ07-${1000 + bookedSeat}`,
                `Seat ${bookedSeat}`,
                'ROUTE A'
            );
        }, 500);
    });

    // 8. Fund Wallet (Monnify Sandbox Simulation)
    btnFundElement.addEventListener('click', () => {
        logToActivityFeed('Initiating secure deposit of ₦1,000 via digital portal...', 'out');
        btnFundElement.disabled = true;
        btnFundElement.textContent = 'Processing...';

        setTimeout(() => {
            walletBalance += 1000;
            walletBalanceElement.textContent = `₦${walletBalance.toLocaleString()}`;
            btnFundElement.disabled = false;
            btnFundElement.textContent = '+ Fund ₦1,000';
            
            logToActivityFeed(`Deposit Successful! ₦1,000 added to your wallet balance.`, 'success');
            logToActivityFeed(`Updated digital wallet balance: ₦${walletBalance.toLocaleString()}`, 'success');
        }, 1200);
    });

    // 9. Reverse-Trip Simulation Trigger
    btnSimulateFull.addEventListener('click', () => {
        // Book all free seats to trigger the reverse trip
        logToActivityFeed('Simulating campus rush hour: filling up outbound shuttle...', 'warn');
        
        let filledCount = 0;
        for (let i = 1; i <= 12; i++) {
            if (seatsState[i] === 'available' || seatsState[i] === 'locked') {
                seatsState[i] = 'booked';
                filledCount++;
            }
        }
        selectedSeat = null;
        clearInterval(countdownInterval);
        timerContainer.classList.add('hidden');
        statusTextElement.innerHTML = `Selected Seat: <span class="booking-status-value idle">None</span>`;
        renderSeats();

        logToActivityFeed(`Outbound Shuttle sh_KQ07 is now full! Status: FULL.`, 'in');

        // Fire Reverse Trip Event after a slight delay
        setTimeout(() => {
            isReverseTripAvailable = true;
            reverseTripCountdown = 480; // reset to 8 mins
            
            reverseAlertCard.style.display = 'flex';
            
            logToActivityFeed('Smart load balancer triggered! Generating inbound returning trip...', 'warn');
            logToActivityFeed('Returning shuttle dispatched: Senate Building -> Main Gate - ETA: 8 mins.', 'in');
            logToActivityFeed('Waiting passengers notified at the Main Gate stop.', 'success');

            startReverseTimer();
        }, 1200);
    });

    // Start Inbound Reverse-Trip Countdown
    function startReverseTimer() {
        clearInterval(reverseTimerInterval);
        
        reverseTimerVal.textContent = formatTime(reverseTripCountdown);
        
        reverseTimerInterval = setInterval(() => {
            reverseTripCountdown--;
            reverseTimerVal.textContent = formatTime(reverseTripCountdown);
            
            if (reverseTripCountdown <= 0) {
                clearInterval(reverseTimerInterval);
                reverseAlertCard.style.display = 'none';
                isReverseTripAvailable = false;
                logToActivityFeed('Returning shuttle has arrived at the Main Gate destination.', 'in');
            }
        }, 1000);
    }

    // Pre-book Reverse Trip
    btnPrebook.addEventListener('click', () => {
        if (walletBalance < 500) {
            logToActivityFeed('Pre-booking failed: Insufficient wallet balance.', 'warn');
            alert('Insufficient balance. Please fund your wallet.');
            return;
        }

        walletBalance -= 500;
        walletBalanceElement.textContent = `₦${walletBalance.toLocaleString()}`;
        
        clearInterval(reverseTimerInterval);
        reverseAlertCard.style.display = 'none';
        isReverseTripAvailable = false;

        logToActivityFeed('Processing returning shuttle pre-booking payment of ₦500...', 'out');
        
        setTimeout(() => {
            logToActivityFeed('Pre-booking payment successful! ₦500 deducted.', 'success');
            logToActivityFeed('Returning leg ticket TKT-REV-8842 generated successfully!', 'success');
            logToActivityFeed('Your seat is secured on the inbound trip. Travel safe!', 'in');
            
            showTicketPopup(
                'Pre-Booking Confirmed!',
                'Your seat on the returning shuttle is secured. Present this boarding pass when the vehicle arrives.',
                'TKT-REV-8842',
                'Seat 3 Pre-Booked',
                'ROUTE B INBOUND'
            );
        }, 500);
    });

    // 10. Consumer Accordion FAQ Logic
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Collapse all other accordion items first
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-content').style.maxHeight = '0px';
            });

            if (!isActive) {
                // Expand this item
                item.classList.add('active');
                // Set max height dynamically to fit content smoothly
                const inner = content.querySelector('.faq-inner');
                content.style.maxHeight = inner.scrollHeight + 32 + 'px'; // add padding buffer
                
                logToActivityFeed(`FAQ Opened: "${trigger.querySelector('span').textContent}"`, 'info');
            } else {
                logToActivityFeed('FAQ Closed.', 'info');
            }
        });
    });

    // Initial Render
    renderSeats();
});

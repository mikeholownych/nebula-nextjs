document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion Functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answerId = this.getAttribute('aria-controls');
            const answer = document.getElementById(answerId);
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            // Toggle the answer visibility and aria-expanded attribute
            this.setAttribute('aria-expanded', !isExpanded);
            answer.hidden = isExpanded;
            
            // Update icon (▼ to ▲ or vice versa)
            const icon = this.querySelector('span');
            if (icon) {
                icon.textContent = isExpanded ? '▼' : '▲';
            }
        });
    });
    
    // Timer countdown functionality
    function updateTimer() {
        const hoursElement = document.getElementById('hours');
        const minutesElement = document.getElementById('minutes');
        const secondsElement = document.getElementById('seconds');
        
        if (!hoursElement || !minutesElement || !secondsElement) return;
        
        // Set initial values
        let hours = 24;
        let minutes = 0;
        let seconds = 0;
        
        // Update every second
        setInterval(function() {
            seconds--;
            if (seconds < 0) {
                seconds = 59;
                minutes--;
            }
            
            if (minutes < 0) {
                minutes = 59;
                hours--;
            }
            
            if (hours < 0) {
                hours = 0;
                minutes = 0;
                seconds = 0;
            }
            
            // Update display
            hoursElement.textContent = hours.toString().padStart(2, '0');
            minutesElement.textContent = minutes.toString().padStart(2, '0');
            secondsElement.textContent = seconds.toString().padStart(2, '0');
        }, 1000);
    }
    
    updateTimer();
});
class StickerBoard {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.zoomLevel = 1;
        this.stickers = new Map();
        this.isDragging = false;
        this.currentSticker = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartTime = 0;
        this.hasMoved = false;
        this.colors = ['#f5ce42', '#f542e6', '#42b6f5', '#FFFFFF'];

        this.initializeEventListeners();
        this.initializeInfoModal();
        this.loadStickers();
    }

    initializeEventListeners() {
        // Canvas click event
        this.canvas.addEventListener('click', (e) => {
            if (!this.hasMoved && e.target === this.canvas) {
                const x = (e.clientX + this.canvas.scrollLeft) / this.zoomLevel;
                const y = (e.clientY + this.canvas.scrollTop) / this.zoomLevel;
                this.createSticker(x, y);
            }
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(0.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(-0.1));

        // Mouse events
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.sticker')) {
                this.isDragging = true;
                this.currentSticker = e.target.closest('.sticker');
                this.dragStartTime = Date.now();
                this.hasMoved = false;
                const rect = this.currentSticker.getBoundingClientRect();
                this.dragOffset = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.currentSticker) {
                this.hasMoved = true;
                const x = (e.clientX - this.dragOffset.x + this.canvas.scrollLeft) / this.zoomLevel;
                const y = (e.clientY - this.dragOffset.y + this.canvas.scrollTop) / this.zoomLevel;
                this.currentSticker.style.left = `${x}px`;
                this.currentSticker.style.top = `${y}px`;
                this.saveStickers();
            }
        });

        document.addEventListener('mouseup', () => {
            setTimeout(() => {
                this.isDragging = false;
                this.currentSticker = null;
                this.hasMoved = false;
            }, 50);
        });

        // Touch events
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.sticker')) {
                const touch = e.touches[0];
                this.isDragging = true;
                this.currentSticker = e.target.closest('.sticker');
                this.dragStartTime = Date.now();
                this.hasMoved = false;
                const rect = this.currentSticker.getBoundingClientRect();
                this.dragOffset = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (this.isDragging && this.currentSticker) {
                this.hasMoved = true;
                const touch = e.touches[0];
                const x = (touch.clientX - this.dragOffset.x + this.canvas.scrollLeft) / this.zoomLevel;
                const y = (touch.clientY - this.dragOffset.y + this.canvas.scrollTop) / this.zoomLevel;
                this.currentSticker.style.left = `${x}px`;
                this.currentSticker.style.top = `${y}px`;
                this.saveStickers();
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            setTimeout(() => {
                this.isDragging = false;
                this.currentSticker = null;
                this.hasMoved = false;
            }, 50);
        });

        // Prevent zoom on double tap for mobile devices
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    initializeInfoModal() {
        const infoButton = document.querySelector('.info-button');
        const modal = document.getElementById('infoModal');
        const closeButton = document.querySelector('.close-modal');

        infoButton.addEventListener('click', () => {
            modal.classList.add('show');
        });

        closeButton.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    }

    createSticker(x, y) {
        const sticker = document.createElement('div');
        const id = Date.now().toString();
        sticker.className = 'sticker';
        sticker.id = id;
        sticker.style.left = `${x - 150}px`;
        sticker.style.top = `${y - 150}px`;
        sticker.style.backgroundColor = '#FFFFFF';

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Введите текст...';
        textarea.addEventListener('input', () => this.saveStickers());

        const controls = document.createElement('div');
        controls.className = 'sticker-controls';

        // Color picker
        const colorPicker = document.createElement('div');
        colorPicker.className = 'color-picker';
        
        this.colors.forEach(color => {
            const colorCircle = document.createElement('div');
            colorCircle.className = 'color-circle';
            if (color === '#FFFFFF') colorCircle.classList.add('active');
            colorCircle.style.backgroundColor = color;
            colorCircle.addEventListener('click', () => {
                sticker.style.backgroundColor = color;
                colorPicker.querySelectorAll('.color-circle').forEach(circle => {
                    circle.classList.remove('active');
                });
                colorCircle.classList.add('active');
                this.saveStickers();
            });
            colorPicker.appendChild(colorCircle);
        });

        const rightControls = document.createElement('div');
        rightControls.className = 'right-controls';

        const dragIcon = document.createElement('i');
        dragIcon.className = 'fas fa-arrows-alt';
        
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteIcon.addEventListener('click', () => {
            sticker.remove();
            this.stickers.delete(id);
            this.saveStickers();
        });

        rightControls.appendChild(dragIcon);
        rightControls.appendChild(deleteIcon);
        
        controls.appendChild(colorPicker);
        controls.appendChild(rightControls);
        
        sticker.appendChild(textarea);
        sticker.appendChild(controls);
        this.canvas.appendChild(sticker);

        this.stickers.set(id, {
            x: x - 150,
            y: y - 150,
            text: '',
            color: '#FFFFFF'
        });

        this.saveStickers();
        
        // Focus textarea after creation
        setTimeout(() => textarea.focus(), 0);
    }

    zoom(delta) {
        this.zoomLevel = Math.max(0.5, Math.min(2, this.zoomLevel + delta));
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
    }

    saveStickers() {
        const stickersData = {};
        this.stickers.forEach((value, key) => {
            const stickerElement = document.getElementById(key);
            if (stickerElement) {
                stickersData[key] = {
                    x: parseFloat(stickerElement.style.left),
                    y: parseFloat(stickerElement.style.top),
                    text: stickerElement.querySelector('textarea').value,
                    color: stickerElement.style.backgroundColor
                };
            }
        });
        localStorage.setItem('stickers', JSON.stringify(stickersData));
    }

    loadStickers() {
        const savedStickers = JSON.parse(localStorage.getItem('stickers') || '{}');
        Object.entries(savedStickers).forEach(([id, data]) => {
            const sticker = document.createElement('div');
            sticker.className = 'sticker';
            sticker.id = id;
            sticker.style.left = `${data.x}px`;
            sticker.style.top = `${data.y}px`;
            sticker.style.backgroundColor = data.color || '#FFFFFF';

            const textarea = document.createElement('textarea');
            textarea.value = data.text;
            textarea.addEventListener('input', () => this.saveStickers());

            const controls = document.createElement('div');
            controls.className = 'sticker-controls';

            const colorPicker = document.createElement('div');
            colorPicker.className = 'color-picker';
            
            this.colors.forEach(color => {
                const colorCircle = document.createElement('div');
                colorCircle.className = 'color-circle';
                if (color === data.color) colorCircle.classList.add('active');
                colorCircle.style.backgroundColor = color;
                colorCircle.addEventListener('click', () => {
                    sticker.style.backgroundColor = color;
                    colorPicker.querySelectorAll('.color-circle').forEach(circle => {
                        circle.classList.remove('active');
                    });
                    colorCircle.classList.add('active');
                    this.saveStickers();
                });
                colorPicker.appendChild(colorCircle);
            });

            const rightControls = document.createElement('div');
            rightControls.className = 'right-controls';

            const dragIcon = document.createElement('i');
            dragIcon.className = 'fas fa-arrows-alt';
            
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-trash';
            deleteIcon.addEventListener('click', () => {
                sticker.remove();
                this.stickers.delete(id);
                this.saveStickers();
            });

            rightControls.appendChild(dragIcon);
            rightControls.appendChild(deleteIcon);
            
            controls.appendChild(colorPicker);
            controls.appendChild(rightControls);
            
            sticker.appendChild(textarea);
            sticker.appendChild(controls);
            this.canvas.appendChild(sticker);

            this.stickers.set(id, {
                x: data.x,
                y: data.y,
                text: data.text,
                color: data.color
            });
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StickerBoard();
});
# FizmatDiary

A modern, beautiful diary application built with vanilla JavaScript, designed specifically for Fizmat students to document their academic journey and personal thoughts.

## Features

- 📝 **Create & Edit Entries**: Write and edit diary entries with a clean, distraction-free interface
- 🔍 **Search Functionality**: Quickly find entries by title or content
- 💾 **Auto-save**: Your entries are automatically saved as you type
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Modern UI**: Beautiful, shadcn-inspired design with smooth animations
- ⌨️ **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + S` to save
  - `Escape` to cancel editing
  - `Alt + N` for new entry
  - `Alt + S` to focus search
- 📊 **Word Count**: Track your writing progress with live word count
- 🗂️ **Entry Management**: Organize and manage all your entries in one place

## ♿ Accessibility Features

FizmatDiary is built with accessibility in mind and follows WCAG 2.1 AA guidelines:

- **Screen Reader Support**: Full ARIA labels, roles, and live regions for screen readers
- **Keyboard Navigation**: Complete keyboard-only navigation support
- **High Contrast Mode**: Toggle high contrast mode for better visibility
- **Reduced Motion**: Respect user motion preferences and provide reduced motion option
- **Focus Management**: Clear focus indicators and logical tab order
- **Semantic HTML**: Proper heading structure and semantic markup
- **Skip Links**: Quick navigation to main content
- **Touch Targets**: Minimum 44px touch targets for mobile accessibility
- **Color Accessibility**: High contrast ratios and color-blind friendly design
- **Screen Reader Announcements**: Live announcements for important actions
- **Modal Accessibility**: Proper focus trapping and keyboard navigation in modals

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (optional, for development server)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser, or
3. Run a local development server:
   ```bash
   npm install
   npm run dev
   ```

### Usage

1. **Create Your First Entry**: Click "New Entry" or "Create First Entry" to start writing
2. **Write Your Thoughts**: Use the title field for entry titles and the main textarea for content
3. **Save Your Work**: Click "Save" or use `Ctrl/Cmd + S` to save your entry
4. **Search Entries**: Use the search box in the sidebar to find specific entries
5. **Edit Entries**: Click on any entry in the sidebar to edit it
6. **Delete Entries**: Use the trash icon to delete unwanted entries

## Technical Details

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox and Grid
- **Storage**: LocalStorage for data persistence
- **Fonts**: Inter font family for optimal readability
- **Icons**: Font Awesome for beautiful icons

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Submitting pull requests
- Improving documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by modern note-taking applications
- UI design influenced by shadcn/ui components
- Built with love for the Fizmat community

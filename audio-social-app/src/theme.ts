const theme = {
  colors: {
    background: '#F9FAFC', // Clean off-white with slight cool undertone
    text: '#2D3047', // Deep navy-charcoal for text, sophisticated alternative to black
    primary: '#FF9F1C', // Vibrant amber/orange - energetic, warm, distinctive
    secondary: '#2EC4B6', // Teal blue - cool complement to the warm primary
    accent: '#E71D36', // Bright crimson for important highlights and actions
    lightText: '#7D8597', // Muted slate for secondary text
    border: '#E6E8ED', // Subtle cool-toned border
    highlight: '#FFF1E0', // Soft amber tint for highlighting elements
    success: '#4CB963', // Fresh green for confirmations
    warning: '#F4D35E', // Gold for caution states, coordinates with primary
    error: '#E63946', // Ruby red for errors
    darkPrimary: '#E08700', // Darker amber for pressed states
    lightPrimary: '#FFEFD1', // Light amber for backgrounds and hover states
  },
};

const audioCardStyle = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 180, // Tamaño similar a los thumbnails de YouTube
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 10,
  },
};



export { theme, audioCardStyle };

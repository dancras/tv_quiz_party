from app import app
import handshake
import lobby

if __name__ == "__main__":
    app.run(debug = True, host = '0.0.0.0')
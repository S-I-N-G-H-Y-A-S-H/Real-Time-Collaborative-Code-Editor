import Header from '../components/Header';
import '../styles/WelcomePage.css';

function WelcomePage() {
    return (
        <div className="welcome-wrapper">
            <Header />
            <div className="welcome-content">
                <h1 className="welcome-title">Welcome to Real-Time Code Editor</h1>
                {/* Add more sections like recent projects, create new, etc. */}
            </div>
        </div>
    );
}

export default WelcomePage;

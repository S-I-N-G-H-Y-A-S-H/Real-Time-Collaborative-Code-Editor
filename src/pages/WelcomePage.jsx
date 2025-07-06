import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/WelcomePage.css';


function WelcomePage() {
    return (
        <div className="welcome-container">
            <Header />
            <div className="main-body">
                <Sidebar />
                <div className="content-area">
                    <h1>Welcome to Real-Time Code Editor</h1>
                    {/* You can add more UI sections here */}
                </div>
            </div>
        </div>
    );
}

export default WelcomePage;

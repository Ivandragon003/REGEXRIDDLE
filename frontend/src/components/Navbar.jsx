import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import Avatar from './Avatar'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Chiude il dropdown cliccando fuori.
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    closeMenu()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.linkActive}` : styles.link

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <div className={styles.inner}>
          <Link to="/" className={styles.logo} onClick={closeMenu}>
            Regex<span className={styles.logoMark}>Riddle</span>
          </Link>

          <button
            className={styles.hamburger}
            aria-label="Apri il menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`${styles.menu} ${menuOpen ? '' : styles.menuClosed}`}>
            <div className={styles.links}>
              <NavLink to="/sfide" className={navLinkClass} onClick={closeMenu}>
                Sfide
              </NavLink>
              <NavLink to="/classifica" className={navLinkClass} onClick={closeMenu}>
                Classifica
              </NavLink>
              <NavLink to="/come-funziona" className={navLinkClass} onClick={closeMenu}>
                Come funziona
              </NavLink>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.iconButton}
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
                title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {isAuthenticated ? (
                <div className={styles.userMenu} ref={dropdownRef}>
                  <button
                    className={styles.userButton}
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    <Avatar username={user?.username} avatarUrl={user?.avatarUrl} size={28} />
                    {user?.username}
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <Link
                        to="/profilo"
                        className={styles.dropdownItem}
                        onClick={() => {
                          setDropdownOpen(false)
                          closeMenu()
                        }}
                      >
                        Profilo
                      </Link>
                      <button className={styles.dropdownItem} onClick={handleLogout}>
                        Esci
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm" onClick={closeMenu}>
                    Accedi
                  </Link>
                  <Link to="/registrati" className="btn btn-primary btn-sm" onClick={closeMenu}>
                    Registrati
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

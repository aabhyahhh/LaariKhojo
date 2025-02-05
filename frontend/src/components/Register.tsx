import { useRef, useState, useEffect, FormEvent } from "react";
import {
  faCheck,
  faTimes,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { AxiosResponse, AxiosError } from "axios";
import { Link } from "react-router-dom";
import "./Register.css";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const REGISTER_URL = "http://localhost:3000/api/register";

interface RegisterProps {
  onRegisterSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const [user, setUser] = useState<string>("");
  const [validName, setValidName] = useState<boolean>(false);
  const [userFocus, setUserFocus] = useState<boolean>(false);

  const [pwd, setPwd] = useState<string>("");
  const [validPwd, setValidPwd] = useState<boolean>(false);
  const [pwdFocus, setPwdFocus] = useState<boolean>(false);

  const [matchPwd, setMatchPwd] = useState<string>("");
  const [validMatch, setValidMatch] = useState<boolean>(false);
  const [matchFocus, setMatchFocus] = useState<boolean>(false);

  const [errMsg, setErrMsg] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (userRef.current) {
      userRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd, matchPwd]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // if button enabled with JS hack
    const v1 = USER_REGEX.test(user);
    const v2 = PWD_REGEX.test(pwd);
    if (!v1 || !v2) {
      setErrMsg("Invalid Entry");
      return;
    }
    try {
      const response: AxiosResponse<RegisterProps> = await axios.post(
        REGISTER_URL,
        JSON.stringify({ user, pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      console.log(response?.data);
      console.log(JSON.stringify(response));

      onRegisterSuccess();

      setSuccess(true);
      //clear state and controlled inputs
      setUser("");
      setPwd("");
      setMatchPwd("");
    } catch (err) {
      const error = err as AxiosError;
      if (!error?.response) {
        setErrMsg("No Server Response");
      } else if (error.response?.status === 409) {
        setErrMsg("Name Taken");
      } else {
        setErrMsg("Registration Failed");
      }
      errRef.current?.focus();
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        {success ? (
          <div className="success-message">
            <h2>Registration Successful!</h2>
            <p>
              <Link to="/login">Sign In</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="register-header">
              <h2>Create Account</h2>
              <p>Please fill in your details</p>
            </div>

            {errMsg && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{errMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="username">
                  Laari Name
                  {user && (
                    <span className="validation-icon">
                      <FontAwesomeIcon
                        icon={validName ? faCheck : faTimes}
                        className={validName ? "valid-icon" : "invalid-icon"}
                      />
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  id="username"
                  ref={userRef}
                  autoComplete="off"
                  onChange={(e) => setUser(e.target.value)}
                  value={user}
                  required
                  aria-invalid={validName ? "false" : "true"}
                  aria-describedby="uidnote"
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                />
                {userFocus && user && !validName && (
                  <p className="input-requirements">
                    <FontAwesomeIcon icon={faInfoCircle} />4 to 24 characters.
                    Must begin with a letter. Letters, numbers, underscores,
                    hyphens allowed.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                  {pwd && (
                    <span className="validation-icon">
                      <FontAwesomeIcon
                        icon={validPwd ? faCheck : faTimes}
                        className={validPwd ? "valid-icon" : "invalid-icon"}
                      />
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  id="password"
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  aria-invalid={validPwd ? "false" : "true"}
                  aria-describedby="pwdnote"
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                />
                {pwdFocus && !validPwd && (
                  <p className="input-requirements">
                    <FontAwesomeIcon icon={faInfoCircle} />4 to 24 characters.
                    Must begin with a letter. Letters, numbers, underscores,
                    hyphens allowed.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm_pwd">
                  Confirm Password
                  {matchPwd && (
                    <span className="validation-icon">
                      <FontAwesomeIcon
                        icon={validMatch ? faCheck : faTimes}
                        className={validMatch ? "valid-icon" : "invalid-icon"}
                      />
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  id="confirm_pwd"
                  onChange={(e) => setMatchPwd(e.target.value)}
                  value={matchPwd}
                  required
                  aria-invalid={validMatch ? "false" : "true"}
                  aria-describedby="confirmnote"
                  onFocus={() => setMatchFocus(true)}
                  onBlur={() => setMatchFocus(false)}
                />
                {matchFocus && !validMatch && (
                  <p className="input-requirements">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    Must match the first password input field.
                  </p>
                )}
              </div>

              <button
                className="register-button"
                disabled={!validName || !validPwd || !validMatch}
              >
                Sign Up
              </button>
            </form>

            <div className="login-link">
              <p>
                Already have an account? <Link to="/login">Sign In</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;

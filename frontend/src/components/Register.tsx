import { useRef, useState, useEffect, FormEvent } from "react";
import {
  faCheck,
  faTimes,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios, { AxiosError } from "axios";
import "./Register.css";

const USER_REGEX = /^[A-Za-z0-9][A-Za-z0-9-_ ]{2,}$/;
const PWD_REGEX = /^[A-Za-z0-9].{2,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
const MAPS_REGEX = /^https:\/\/www\.google\.(com|co\.in)\/maps\/place\/.+/i;
const API_URL = "https://laari-khojo-backend.onrender.com/";
const REGISTER_URL = `${API_URL}/api/register`;

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

  const [email, setEmail] = useState<string>("");
  const [validEmail, setValidEmail] = useState<boolean>(false);
  const [emailFocus, setEmailFocus] = useState<boolean>(false);

  const [contactNumber, setContactNumber] = useState<string>("");
  const [validContactNumber, setValidContactNumber] = useState<boolean>(false);
  const [contactNumberFocus, setContactNumberFocus] = useState<boolean>(false);

  const [mapsLink, setMapsLink] = useState<string>("");
  const [validMapsLink, setValidMapsLink] = useState<boolean>(false);
  const [mapsLinkFocus, setMapsLinkFocus] = useState<boolean>(false);

  const [foodType, setFoodType] = useState<'veg' | 'non-veg' | 'swaminarayan' | 'jain' | 'none'>('none');
  const [validFoodType, setValidFoodType] = useState<boolean>(false);

  const [errMsg, setErrMsg] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
  ];

  const handleDayToggle = (dayId: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

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

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidContactNumber(PHONE_REGEX.test(contactNumber));
  }, [contactNumber]);

  useEffect(() => {
    setValidMapsLink(MAPS_REGEX.test(mapsLink));
  }, [mapsLink]);

  useEffect(() => {
    setValidFoodType(foodType !== 'none');
  }, [foodType]);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd, matchPwd, email, contactNumber, mapsLink, foodType]);

  // Prepare operating hours data for API submission
  const prepareOperatingHours = () => {
    return {
      days: selectedDays,
      openTime,
      closeTime,
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const v1 = USER_REGEX.test(user);
    const v2 = PWD_REGEX.test(pwd);
    const v3 = EMAIL_REGEX.test(email);
    const v4 = PHONE_REGEX.test(contactNumber);
    const v5 = MAPS_REGEX.test(mapsLink);
    const v6 = foodType !== 'none';

    if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6) {
      setErrMsg("Invalid Entry - Please check all fields including food type");
      return;
    }

    // Get operating hours
    const operatingHours = prepareOperatingHours();

    try {
      await axios.post(
        REGISTER_URL,
        JSON.stringify({
          name: user,
          password: pwd,
          email,
          contactNumber,
          mapsLink,
          operatingHours,
          foodType,
        }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      onRegisterSuccess();

      setSuccess(true);
      //clear state and controlled inputs
      setUser("");
      setPwd("");
      setMatchPwd("");
      setEmail("");
      setContactNumber("");
      setMapsLink("");
      setFoodType('none'); // Reset food type
    } catch (err) {
      const error = err as AxiosError<{ msg?: string }>; // Define expected response structure
      if (!error?.response) {
        setErrMsg("No Server Response");
      } else if (error.response?.status === 409) {
        setErrMsg("Name Taken");
      } else {
        console.error("Registration Failed:", error.response?.data);
        setErrMsg(
          `Registration Failed: ${error.response?.data?.msg || "Unknown error"}`
        );
      }
      errRef.current?.focus();
    }
  };

  return (
    <>
      <div className="register-container">
        <div className="register-card">
          {success ? (
            <div className="success-message">
              <h2>Registration Successful!</h2>
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
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Vendor stall name must start with a letter or number and
                      be at least 3 characters long. It can contain letters,
                      numbers, spaces, hyphens, and underscores.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email
                    {email && (
                      <span className="validation-icon">
                        <FontAwesomeIcon
                          icon={validEmail ? faCheck : faTimes}
                          className={validEmail ? "valid-icon" : "invalid-icon"}
                        />
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    required
                    aria-invalid={validEmail ? "false" : "true"}
                    aria-describedby="emailnote"
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                  />
                  {emailFocus && email && !validEmail && (
                    <p className="input-requirements">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">
                    Contact Number
                    {contactNumber && (
                      <span className="validation-icon">
                        <FontAwesomeIcon
                          icon={validContactNumber ? faCheck : faTimes}
                          className={
                            validContactNumber ? "valid-icon" : "invalid-icon"
                          }
                        />
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="contactNumber"
                    onChange={(e) => setContactNumber(e.target.value)}
                    value={contactNumber}
                    required
                    aria-invalid={validContactNumber ? "false" : "true"}
                    aria-describedby="contactnote"
                    onFocus={() => setContactNumberFocus(true)}
                    onBlur={() => setContactNumberFocus(false)}
                  />
                  {contactNumberFocus && contactNumber && !validContactNumber && (
                    <p className="input-requirements">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Please enter a valid 10-digit Indian contact number.
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="foodType">
                    Food Type
                    {foodType !== 'none' && (
                      <span className="validation-icon">
                        <FontAwesomeIcon
                          icon={validFoodType ? faCheck : faTimes}
                          className={validFoodType ? "valid-icon" : "invalid-icon"}
                        />
                      </span>
                    )}
                  </label>
                  <select
                    id="foodType"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as 'veg' | 'non-veg' | 'swaminarayan' | 'jain' | 'none')}
                    required
                    style={{
                      borderColor: foodType === 'none' ? '#ff6b6b' : '#4ecdc4'
                    }}
                  >
                    <option value="none">Select Food Type *</option>
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="swaminarayan">Swaminarayan</option>
                    <option value="jain">Jain</option>
                  </select>
                  {foodType === 'none' && (
                    <p className="input-requirements">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Please select a food type
                    </p>
                  )}
                </div>

                <div className="form-group operating-hours-section">
                  <h3>Operating Hours</h3>
                  <div className="opening-hours-container">
                    <div className="time-inputs">
                      <label htmlFor="openTime">Open Time</label>
                      <input
                        type="time"
                        id="openTime"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="time-inputs">
                      <label htmlFor="closeTime">Close Time</label>
                      <input
                        type="time"
                        id="closeTime"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Operating Days Section */}
                <div className="form-group">
                  <label>Operating Days</label>
                  <div className="days-grid">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="day-checkbox">
                        <label htmlFor={`day-${day.id}`}>{day.name}</label>

                        <input
                          type="checkbox"
                          id={`day-${day.id}`}
                          checked={selectedDays.includes(day.id)}
                          onChange={() => handleDayToggle(day.id)}
                          className="day-checkbox-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="mapsLink">
                    Google Maps Link
                    {mapsLink && (
                      <span className="validation-icon">
                        <FontAwesomeIcon
                          icon={validMapsLink ? faCheck : faTimes}
                          className={
                            validMapsLink ? "valid-icon" : "invalid-icon"
                          }
                        />
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="mapsLink"
                    onChange={(e) => setMapsLink(e.target.value)}
                    value={mapsLink}
                    required
                    aria-invalid={validMapsLink ? "false" : "true"}
                    aria-describedby="mapslinknote"
                    onFocus={() => setMapsLinkFocus(true)}
                    onBlur={() => setMapsLinkFocus(false)}
                  />
                  {mapsLinkFocus && mapsLink && !validMapsLink && (
                    <p className="input-requirements">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Please enter a valid Google Maps link with coordinates
                      (e.g.,
                      <br />
                      `https://www.google.com/maps/place/Someplace/@12.345,-67.890,...`).
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
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Password must start with a letter or number and be at
                      least 3 characters long
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
                  disabled={!validName || !validPwd || !validMatch || foodType === 'none'}
                >
                  Sign Up
                </button>
              </form>

            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Register;
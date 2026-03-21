import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { imageCompressor } from "../assets/js/imageCompressor";
import AddUserModal from "../assets/components/AddUserModal";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { getBoardingBookingEmailHtml } from "../assets/js/boardingBookingEmail";
import BookingDetailModal from "../assets/components/BookingDetailModal";
import AddPetModal from "../assets/components/AddPetModal";
import { getExtensionPaymentEmailHtml } from "../assets/js/extensionPaymentEmail";

const KennelsAdminPage = () => {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");

    const { section } = useParams();
    const activeTab = section || "kennels";
    const navigate = useNavigate();

    const [kennels, setKennels] = useState([]);
    const [loadingKennels, setLoadingKennels] = useState(true);
    const [kennelsCached, setKennelsCached] = useState(false);
    const [searchKennel, setSearchKennel] = useState("");

    // Bookings
    const [allBookings, setAllBookings] = useState([]);
    const [bookingsCached, setBookingsCached] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [bookingsSearch, setBookingsSearch] = useState("");
    const [bookingsKennelFilter, setBookingsKennelFilter] = useState("all");
    const [bookingsStatusFilter, setBookingsStatusFilter] = useState("all");
    const [bookingsModeFilter, setBookingsModeFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Revenue
    const [revDateRange, setRevDateRange] = useState("all_time");

    // Manual entry
    const [manualKennel, setManualKennel] = useState(null);
    const [manualKennelInfo, setManualKennelInfo] = useState(null);
    const [manualUser, setManualUser] = useState(null);
    const [manualUserQuery, setManualUserQuery] = useState("");
    const [lookingUpUser, setLookingUpUser] = useState(false);
    const [userLookupDone, setUserLookupDone] = useState(false);
    const [userNotFound, setUserNotFound] = useState(false);
    const [manualPets, setManualPets] = useState([]);
    const [manualSelectedPets, setManualSelectedPets] = useState([]);
    const [manualRoomType, setManualRoomType] = useState(null);
    const [manualRoomOccupancy, setManualRoomOccupancy] = useState([]);
    const [loadingManualRooms, setLoadingManualRooms] = useState(false);
    const [manualSelectedRooms, setManualSelectedRooms] = useState([]);
    const [manualCheckIn, setManualCheckIn] = useState("");
    const [manualCheckOut, setManualCheckOut] = useState("");
    const [manualAvailability, setManualAvailability] = useState(null);
    const [loadingManualAvailability, setLoadingManualAvailability] = useState(false);
    const [loadingManualPets, setLoadingManualPets] = useState(false);
    const [loadingManualKennel, setLoadingManualKennel] = useState(false);
    const [manualSubmitting, setManualSubmitting] = useState(false);
    const [showAddPetModal, setShowAddPetModal] = useState(false);

    // Add User modal
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // Today's Activity
    const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0]);

    // Occupancy
    const [occupancyKennelId, setOccupancyKennelId] = useState("");
    const [occupancyDate, setOccupancyDate] = useState(new Date().toISOString().split("T")[0]);
    const [occupancyData, setOccupancyData] = useState(null);
    const [loadingOccupancy, setLoadingOccupancy] = useState(false);
    const [occupancyView, setOccupancyView] = useState("summary");
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [calendarMode, setCalendarMode] = useState("month"); // "month" or "year"
    const [calendarKennelId, setCalendarKennelId] = useState("");
    const [calTooltip, setCalTooltip] = useState({ show: false, x: 0, y: 0, text: "" });
    const [roomOccupancy, setRoomOccupancy] = useState([]);
    const [loadingRoomOccupancy, setLoadingRoomOccupancy] = useState(false);
    const [roomOccupancyCached, setRoomOccupancyCached] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Employees
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employeesKennelId, setEmployeesKennelId] = useState("");
    const [employeesSearch, setEmployeesSearch] = useState("");
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [employeeUsers, setEmployeeUsers] = useState([]);
    const [loadingEmployeeUsers, setLoadingEmployeeUsers] = useState(false);
    const [newEmployee, setNewEmployee] = useState({
        user_id: "",
        can_manage_bookings: false, can_manage_kennel: false
    });
    const [submittingEmployee, setSubmittingEmployee] = useState(false);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    // Extensions
    const [extensions, setExtensions] = useState([]);
    const [loadingExtensions, setLoadingExtensions] = useState(false);
    const [extensionsCached, setExtensionsCached] = useState(false);
    const [extensionsSearch, setExtensionsSearch] = useState("");

    // Profile
    const [profileKennelId, setProfileKennelId] = useState("");
    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [profileTab, setProfileTab] = useState("pricing");
    const [editedPricing, setEditedPricing] = useState([]);
    const [savingPricing, setSavingPricing] = useState(false);
    const [allFeatures, setAllFeatures] = useState([]);
    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
    const [savingFeatures, setSavingFeatures] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageUploadProgress, setImageUploadProgress] = useState({ current: 0, total: 0 });
    const [removingImage, setRemovingImage] = useState(null);

    // Closures
    const [closures, setClosures] = useState([]);
    const [loadingClosures, setLoadingClosures] = useState(false);
    const [closureKennelId, setClosureKennelId] = useState("");
    const [closureStart, setClosureStart] = useState("");
    const [closureEnd, setClosureEnd] = useState("");
    const [closureReason, setClosureReason] = useState("Maintenance");
    const [submittingClosure, setSubmittingClosure] = useState(false);
    const [conflictingBookings, setConflictingBookings] = useState([]);
    const [cancellingClosureId, setCancellingClosureId] = useState(null);

    // Notes
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesBooking, setNotesBooking] = useState(null);
    const [bookingNotes, setBookingNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [submittingNote, setSubmittingNote] = useState(false);

    // Admin cancel booking
    const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);
    const [adminCancelBooking, setAdminCancelBooking] = useState(null);
    const [adminCancelPreview, setAdminCancelPreview] = useState(null);
    const [adminCancelLoading, setAdminCancelLoading] = useState(false);
    const [adminCancelProcessing, setAdminCancelProcessing] = useState(false);

    // Check-in with note
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [checkInBooking, setCheckInBooking] = useState(null);
    const [checkInNote, setCheckInNote] = useState("");
    const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

    // Checkout with notes
    const [showCheckoutNotesModal, setShowCheckoutNotesModal] = useState(false);
    const [checkoutNotesBooking, setCheckoutNotesBooking] = useState(null);
    const [checkoutNotes, setCheckoutNotes] = useState([]);
    const [loadingCheckoutNotes, setLoadingCheckoutNotes] = useState(false);
    const [checkoutNote, setCheckoutNote] = useState("");
    const [processingCheckout, setProcessingCheckout] = useState(false);

    // Checkout pending payments modal
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutBooking, setCheckoutBooking] = useState(null);
    const [checkoutPending, setCheckoutPending] = useState(null);
    const [resendingCheckoutId, setResendingCheckoutId] = useState(null);
    const [forcingCheckout, setForcingCheckout] = useState(false);
    const [refreshingCheckout, setRefreshingCheckout] = useState(false);

    // Extension modal
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [extendBooking, setExtendBooking] = useState(null);
    const [extendNewDate, setExtendNewDate] = useState("");
    const [extendAmount, setExtendAmount] = useState(0);
    const [extendCalculatedAmount, setExtendCalculatedAmount] = useState(0);
    const [submittingExtend, setSubmittingExtend] = useState(false);

    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Kennel detail modal
    const [showKennelModal, setShowKennelModal] = useState(false);
    const [kennelInfo, setKennelInfo] = useState(null);

    // Profile functions
    const fetchProfileData = async (kennelId) => {
        setLoadingProfile(true);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_INFO",
                session_id,
                kennel_id: parseInt(kennelId)
            });
            if (response?.success) {
                setProfileData(response.data);
                setEditedPricing((response.data.rooms || []).map(r => ({
                    room_type_id: r.room_type_id,
                    room_type_name: r.room_type_name,
                    count: r.count,
                    price_small: parseFloat(r.price_small),
                    price_medium: parseFloat(r.price_medium),
                    price_large: parseFloat(r.price_large)
                })));
                setSelectedFeatureIds((response.data.features || []).map(f => f.id));
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchAllFeatures = async () => {
        setLoadingFeatures(true);
        try {
            const response = await callServicesApi({
                action: "GET_FEATURES",
                session_id
            });
            if (response?.success) {
                setAllFeatures(response.data || []);
            }
        } catch (err) {
            console.error("Error fetching features:", err);
        } finally {
            setLoadingFeatures(false);
        }
    };

    useEffect(() => {
        if (activeTab === "profile" && profileKennels.length > 0 && !profileKennelId) {
            setProfileKennelId(profileKennels[0].id);
        }
    }, [activeTab, kennels]);

    useEffect(() => {
        if (profileKennelId) {
            fetchProfileData(profileKennelId);
            if (allFeatures.length === 0) fetchAllFeatures();
        }
    }, [profileKennelId]);

    const handleSavePricing = async () => {
        setSavingPricing(true);
        try {
            const response = await callServicesApi({
                action: "UPDATE_KENNEL_PROFILE",
                session_id,
                kennel_id: parseInt(profileKennelId),
                update_type: "pricing",
                rooms: editedPricing.map(r => ({
                    room_type_id: r.room_type_id,
                    price_small: r.price_small,
                    price_medium: r.price_medium,
                    price_large: r.price_large
                }))
            });
            if (response?.success) {
                setSuccessMsg("Pricing updated successfully.");
                fetchProfileData(profileKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to update pricing.");
            }
        } catch { setErrorMsg("Error updating pricing."); }
        finally { setSavingPricing(false); }
    };

    const handleSaveFeatures = async () => {
        setSavingFeatures(true);
        try {
            const response = await callServicesApi({
                action: "UPDATE_KENNEL_PROFILE",
                session_id,
                kennel_id: parseInt(profileKennelId),
                update_type: "features",
                feature_ids: selectedFeatureIds
            });
            if (response?.success) {
                setSuccessMsg("Features updated successfully.");
                fetchProfileData(profileKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to update features.");
            }
        } catch { setErrorMsg("Error updating features."); }
        finally { setSavingFeatures(false); }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setUploadingImages(true);
        setImageUploadProgress({ current: 0, total: files.length });
        try {
            const urls = [];
            for (let i = 0; i < files.length; i++) {
                setImageUploadProgress({ current: i + 1, total: files.length });
                const compressed = await imageCompressor(files[i]);
                const url = await uploadImageToS3(compressed, "kennels/");
                urls.push(url);
            }
            const response = await callServicesApi({
                action: "UPDATE_KENNEL_PROFILE",
                session_id,
                kennel_id: parseInt(profileKennelId),
                update_type: "add_images",
                images: urls
            });
            if (response?.success) {
                setSuccessMsg(`${urls.length} image(s) uploaded.`);
                fetchProfileData(profileKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to add images.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Error uploading images.");
        } finally {
            setUploadingImages(false);
            e.target.value = "";
        }
    };

    const handleRemoveImage = async (imageUrl) => {
        if (!window.confirm("Remove this image?")) return;
        setRemovingImage(imageUrl);
        try {
            const response = await callServicesApi({
                action: "UPDATE_KENNEL_PROFILE",
                session_id,
                kennel_id: parseInt(profileKennelId),
                update_type: "remove_image",
                image_url: imageUrl
            });
            if (response?.success) {
                setSuccessMsg("Image removed.");
                fetchProfileData(profileKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to remove image.");
            }
        } catch { setErrorMsg("Error removing image."); }
        finally { setRemovingImage(null); }
    };

    // Extension functions
    const openExtendModal = (booking) => {
        setExtendBooking(booking);
        setExtendNewDate("");
        setExtendAmount(0);
        setExtendCalculatedAmount(0);
        setShowExtendModal(true);
    };

    const calculateExtensionPrice = (booking, newDate) => {
        if (!booking || !newDate) return 0;
        const currentCheckout = new Date(booking.check_out_date);
        const newCheckout = new Date(newDate);
        const extraDays = Math.ceil((newCheckout - currentCheckout) / (1000 * 60 * 60 * 24));
        if (extraDays <= 0) return 0;

        // Use the per-pet pricing from the booking
        let totalExtra = 0;
        if (booking.pets?.length > 0) {
            booking.pets.forEach(p => {
                const pricePerDay = parseFloat(p.price_per_day) || 0;
                totalExtra += pricePerDay * extraDays;
            });
        }
        return Math.round(totalExtra * 100) / 100;
    };

    const handleExtendDateChange = (newDate) => {
        setExtendNewDate(newDate);
        const calc = calculateExtensionPrice(extendBooking, newDate);
        setExtendCalculatedAmount(calc);
        setExtendAmount(calc);
    };

    const handleSubmitExtension = async () => {
        if (!extendBooking || !extendNewDate) {
            setErrorMsg("Please select a new checkout date."); return;
        }
        if (parseFloat(extendAmount) < 0) {
            setErrorMsg("Amount cannot be negative."); return;
        }
        setSubmittingExtend(true);
        try {
            const response = await callServicesApi({
                action: "UPDATE_BOOKING_STATUS",
                session_id,
                booking_id: extendBooking.booking_id,
                new_status: "extend",
                new_checkout_date: extendNewDate,
                extension_amount: parseFloat(extendAmount),
                created_by: userData.id
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                if (response.extension?.link_url) {
                    // Send payment link email to customer
                    try {
                        const emailHtml = getExtensionPaymentEmailHtml({
                            userName: extendBooking.first_name || "Guest",
                            kennelName: extendBooking.kennel_name,
                            bookingId: extendBooking.booking_id,
                            originalCheckout: formatDate(extendBooking.check_out_date),
                            newCheckout: formatDate(extendNewDate),
                            extraDays: Math.ceil((new Date(extendNewDate) - new Date(extendBooking.check_out_date)) / (1000 * 60 * 60 * 24)),
                            amount: parseFloat(extendAmount).toFixed(2),
                            paymentLink: response.extension.link_url
                        });
                        await callServicesApi({
                            action: "SEND_EMAIL",
                            session_id,
                            email: extendBooking.email,
                            subject: `Booking Extension: Payment Required - #${extendBooking.booking_id}`,
                            html: emailHtml
                        });
                        setSuccessMsg(`${response.message} Payment link sent to ${extendBooking.email}.`);
                    } catch (emailErr) {
                        console.error("Failed to send extension email:", emailErr);
                        setSuccessMsg(`${response.message} Payment link created but email could not be sent.`);
                    }
                }
                setShowExtendModal(false);
                setBookingsCached(false);
                await fetchAllBookings(true);
                setExtensionsCached(false);
            } else {
                setErrorMsg(response?.message || "Failed to extend booking.");
            }
        } catch { setErrorMsg("Error extending booking."); }
        finally { setSubmittingExtend(false); }
    };

    // Closure functions
    const fetchClosures = async () => {
        const ids = kennels.map(k => k.id);
        if (ids.length === 0) return;
        setLoadingClosures(true);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_CLOSURES",
                session_id,
                kennel_ids: ids
            });
            if (response?.success) {
                setClosures(response.closures || []);
            }
        } catch (err) {
            console.error("Error fetching closures:", err);
        } finally {
            setLoadingClosures(false);
        }
    };

    const handleCreateClosure = async () => {
        if (!closureKennelId || !closureStart || !closureEnd) {
            setErrorMsg("Please select kennel and date range.");
            return;
        }
        if (new Date(closureEnd) < new Date(closureStart)) {
            setErrorMsg("End date must be after start date.");
            return;
        }
        setSubmittingClosure(true);
        setConflictingBookings([]);
        try {
            const response = await callServicesApi({
                action: "CREATE_KENNEL_CLOSURE",
                session_id,
                kennel_id: parseInt(closureKennelId),
                closure_start: closureStart,
                closure_end: closureEnd,
                reason: closureReason,
                created_by: userData.id
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                setClosureStart("");
                setClosureEnd("");
                setClosureReason("Maintenance");
                fetchClosures();
            } else if (response?.has_conflicts) {
                setConflictingBookings(response.conflicting_bookings || []);
            } else {
                setErrorMsg(response?.message || "Failed to create closure.");
            }
        } catch { setErrorMsg("Error creating closure."); }
        finally { setSubmittingClosure(false); }
    };

    const handleCancelClosure = async (closureId) => {
        if (!window.confirm("Cancel this scheduled closure?")) return;
        setCancellingClosureId(closureId);
        try {
            const response = await callServicesApi({
                action: "CANCEL_KENNEL_CLOSURE",
                session_id,
                closure_id: closureId
            });
            if (response?.success) {
                setSuccessMsg("Closure cancelled.");
                fetchClosures();
            } else {
                setErrorMsg(response?.message || "Failed to cancel closure.");
            }
        } catch { setErrorMsg("Error cancelling closure."); }
        finally { setCancellingClosureId(null); }
    };

    // Derived: user permissions for current kennels
    const getUserPermissions = () => {
        const isOwner = kennels.some(k => k.user_role === "owner");
        if (isOwner) {
            return { isOwner: true, canManageBookings: true, canManageKennel: true };
        }
        return {
            isOwner: false,
            canManageBookings: kennels.some(k => k.can_manage_bookings),
            canManageKennel: kennels.some(k => k.can_manage_kennel),
        };
    };

    // Per-kennel permission filtered lists
    const bookingKennels = kennels.filter(k => k.user_role === "owner" || k.can_manage_bookings);
    const profileKennels = kennels.filter(k => k.user_role === "owner" || k.can_manage_kennel);

    useEffect(() => {
        fetchManagedKennels();
    }, []);

    useEffect(() => {
        if (kennels.length > 0) {
            fetchClosures();
        }
    }, [kennels]);

    useEffect(() => {
        if (activeTab === "closure" && profileKennels.length > 0 && !closureKennelId) {
            setClosureKennelId(profileKennels[0].id);
        }
    }, [activeTab, kennels]);

    useEffect(() => {
        if (activeTab === "profile" && kennels.length > 0) {
            const ownerKennels = kennels.filter(k => k.user_role === "owner" || k.can_manage_kennel);
            if (ownerKennels.length > 0 && !profileKennelId) {
                setProfileKennelId(ownerKennels[0].id);
            }
        }
    }, [activeTab, kennels]);

    useEffect(() => {
        if (profileKennelId) {
            fetchProfileData(profileKennelId);
            if (allFeatures.length === 0) fetchAllFeatures();
        }
    }, [profileKennelId]);

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

    const fetchManagedKennels = async (forceRefresh = false) => {
        if (kennelsCached && !forceRefresh) return;
        setLoadingKennels(true);
        try {
            const response = await callServicesApi({
                action: "GET_MANAGED_KENNELS",
                session_id,
                user_id: userData.id
            });
            if (response?.success) {
                setKennels(response.kennels || []);
                setKennelsCached(true);
            }
        } catch (err) {
            console.error("Error fetching managed kennels:", err);
        } finally {
            setLoadingKennels(false);
        }
    };

    const fetchExtensions = async (forceRefresh = false) => {
        if (extensionsCached && !forceRefresh) return;
        const ids = bookingKennels.map(k => k.id);
        if (ids.length === 0) return;
        setLoadingExtensions(true);
        try {
            const response = await callServicesApi({
                action: "GET_BOOKING_EXTENSIONS",
                session_id,
                kennel_ids: ids
            });
            if (response?.success) {
                setExtensions(response.extensions || []);
                setExtensionsCached(true);
            }
        } catch (err) {
            console.error("Error fetching extensions:", err);
        } finally {
            setLoadingExtensions(false);
        }
    };

    const [resendingExtensionId, setResendingExtensionId] = useState(null);

    const handleResendExtensionEmail = async (ext) => {
        setResendingExtensionId(ext.id);
        try {
            if (ext.payment_mode === "online" && ext.link_url) {
                const emailHtml = getExtensionPaymentEmailHtml({
                    userName: ext.first_name || "Guest",
                    kennelName: ext.kennel_name,
                    bookingId: ext.booking_id,
                    originalCheckout: formatDate(ext.original_checkout_date),
                    newCheckout: formatDate(ext.new_checkout_date),
                    extraDays: ext.extra_days,
                    amount: parseFloat(ext.amount).toFixed(2),
                    paymentLink: ext.link_url
                });
                await callServicesApi({
                    action: "SEND_EMAIL",
                    session_id,
                    email: ext.email,
                    subject: `Booking Extension: Payment Required - #${ext.booking_id}`,
                    html: emailHtml
                });
            } else {
                // Offline — send a simple reminder
                const emailHtml = getExtensionPaymentEmailHtml({
                    userName: ext.first_name || "Guest",
                    kennelName: ext.kennel_name,
                    bookingId: ext.booking_id,
                    originalCheckout: formatDate(ext.original_checkout_date),
                    newCheckout: formatDate(ext.new_checkout_date),
                    extraDays: ext.extra_days,
                    amount: parseFloat(ext.amount).toFixed(2),
                    paymentLink: "https://wagnwonder.co/account/creche-bookings"
                });
                await callServicesApi({
                    action: "SEND_EMAIL",
                    session_id,
                    email: ext.email,
                    subject: `Booking Extended: #${ext.booking_id} - ${ext.kennel_name}`,
                    html: emailHtml
                });
            }
            setSuccessMsg(`Email sent to ${ext.email}`);
        } catch {
            setErrorMsg("Failed to send email.");
        } finally {
            setResendingExtensionId(null);
        }
    };

    const fetchAllBookings = async (forceRefresh = false) => {
        if (bookingsCached && !forceRefresh) return;
        setLoadingBookings(true);
        try {
            const kennelIds = kennels.map(k => k.id);
            if (kennelIds.length === 0) {
                setAllBookings([]);
                setBookingsCached(true);
                setLoadingBookings(false);
                return;
            }
            const response = await callServicesApi({
                action: "GET_KENNEL_BOOKINGS",
                session_id,
                kennel_ids: kennelIds
            });
            if (response?.success) {
                setAllBookings(response.bookings || []);
                setBookingsCached(true);
            }
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleKennelClick = (kennel) => {
        setKennelInfo(null);
        setShowKennelModal(true);
        fetchKennelInfo(kennel.id);
    };

    const fetchKennelInfo = async (kennelId) => {
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_INFO",
                session_id,
                kennel_id: kennelId
            });
            if (response?.success) {
                setKennelInfo(response.data);
            }
        } catch (err) {
            console.error("Error fetching kennel info:", err);
        }
    };

    const filteredKennels = kennels.filter(k => {
        if (searchKennel.trim()) {
            const s = searchKennel.toLowerCase();
            return (
                k.name?.toLowerCase().includes(s) ||
                k.city?.toLowerCase().includes(s) ||
                k.state?.toLowerCase().includes(s)
            );
        }
        return true;
    });

    const bookingKennelIds = new Set(bookingKennels.map(k => k.id));
    const filteredBookings = allBookings.filter(b => {
        if (!bookingKennelIds.has(b.kennel_id)) return false;
        if (bookingsKennelFilter !== "all" && b.kennel_id !== parseInt(bookingsKennelFilter)) return false;
        if (bookingsStatusFilter !== "all" && b.status !== bookingsStatusFilter) return false;
        if (bookingsModeFilter !== "all" && b.mode !== bookingsModeFilter) return false;
        if (bookingsSearch.trim()) {
            const s = bookingsSearch.toLowerCase();
            return (
                b.first_name?.toLowerCase().includes(s) ||
                b.last_name?.toLowerCase().includes(s) ||
                b.email?.toLowerCase().includes(s) ||
                b.phone_number?.includes(s) ||
                b.kennel_name?.toLowerCase().includes(s) ||
                b.booking_id?.toString().includes(s)
            );
        }
        return true;
    });

    // Manual entry handlers
    const handleManualKennelSelect = async (kennelId) => {
        if (!kennelId) { setManualKennel(null); setManualKennelInfo(null); return; }
        const k = kennels.find(kn => kn.id === parseInt(kennelId));
        setManualKennel(k || null);
        setManualRoomType(null);
        setManualAvailability(null);
        setManualCheckIn("");
        setManualCheckOut("");
        setManualSelectedRooms([]);
        setManualRoomOccupancy([]);
        setManualUser(null);
        setManualUserQuery("");
        setUserLookupDone(false);
        setUserNotFound(false);
        setLoadingManualKennel(true);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_INFO",
                session_id,
                kennel_id: parseInt(kennelId)
            });
            if (response?.success) {
                setManualKennelInfo(response.data);
            }
        } catch (err) {
            console.error("Error fetching kennel info:", err);
        } finally {
            setLoadingManualKennel(false);
        }
    };

    const handleUserLookup = async () => {
        if (!manualUserQuery.trim()) return;
        setLookingUpUser(true);
        setUserNotFound(false);
        setManualUser(null);
        setUserLookupDone(false);
        try {
            const response = await callServicesApi({
                action: "LOOKUP_USER",
                session_id,
                query: manualUserQuery.trim()
            });
            if (response?.success && response.user) {
                setManualUser(response.user);
                setUserLookupDone(true);
                fetchManualPets(response.user.id);
            } else {
                setUserNotFound(true);
                setUserLookupDone(true);
            }
        } catch (err) {
            console.error("Error looking up user:", err);
            setUserNotFound(true);
            setUserLookupDone(true);
        } finally {
            setLookingUpUser(false);
        }
    };

    const fetchManualPets = async (userId) => {
        setLoadingManualPets(true);
        setManualPets([]);
        setManualSelectedPets([]);
        try {
            const response = await callServicesApi({
                action: "GET_ALL_PETS",
                session_id
            });
            if (response?.success) {
                setManualPets((response.data || []).filter(p => p.owner_id === userId));
            }
        } catch (err) {
            console.error("Error fetching pets:", err);
        } finally {
            setLoadingManualPets(false);
        }
    };

    const fetchManualAvailability = async (kennelId, checkIn, checkOut) => {
        if (!kennelId || !checkIn || !checkOut) return;

        // Check for maintenance closure
        const closureConflict = closures.find(c =>
            c.kennel_id === parseInt(kennelId) &&
            c.closure_start <= checkOut &&
            c.closure_end >= checkIn
        );
        if (closureConflict) {
            setManualAvailability(null);
            setManualRoomType(null);
            setErrorMsg(`This kennel is closed for maintenance from ${formatDate(closureConflict.closure_start)} to ${formatDate(closureConflict.closure_end)}.`);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setLoadingManualAvailability(true);
        setManualRoomType(null);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_BOOKING",
                session_id,
                kennel_id: parseInt(kennelId),
                pet_count: 1,
                check_in: checkIn,
                check_out: checkOut
            });
            if (response?.success) {
                setManualAvailability(response.room_types || []);
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
        } finally {
            setLoadingManualAvailability(false);
        }
    };

    const fetchManualRoomOccupancy = async () => {
        if (!manualKennelInfo || !manualCheckIn || !manualCheckOut) return;
        setLoadingManualRooms(true);
        try {
            const response = await callServicesApi({
                action: "GET_ROOM_OCCUPANCY",
                session_id,
                kennel_id: manualKennelInfo.id,
                check_in: manualCheckIn,
                check_out: manualCheckOut
            });
            if (response?.success) {
                setManualRoomOccupancy(response.rooms || []);
            }
        } catch (err) {
            console.error("Error fetching room occupancy:", err);
        } finally {
            setLoadingManualRooms(false);
        }
    };

    const handleManualPetToggle = (petId) => {
        if (manualSelectedPets.includes(petId)) {
            setManualSelectedPets(manualSelectedPets.filter(id => id !== petId));
        } else {
            setManualSelectedPets([...manualSelectedPets, petId]);
        }
    };

    useEffect(() => {
        if ((activeTab === "bookings" || activeTab === "today" || activeTab === "occupancy" || activeTab === "revenue" || activeTab === "extensions") && kennels.length > 0) {
            fetchAllBookings();
        }
        if (activeTab === "extensions" && kennels.length > 0) {
            fetchExtensions();
        }
        if (activeTab === "employees" && kennels.length > 0) {
            const ownerKennels = kennels.filter(k => k.user_role === "owner");
            if (ownerKennels.length > 0 && !employeesKennelId) {
                setEmployeesKennelId(ownerKennels[0].id);
            }
        }
    }, [activeTab, kennels]);

    useEffect(() => {
        if (employeesKennelId) fetchKennelEmployees(employeesKennelId);
    }, [employeesKennelId]);

    const fetchKennelEmployees = async (kennelId) => {
        setLoadingEmployees(true);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_EMPLOYEES",
                session_id,
                kennel_id: parseInt(kennelId)
            });
            if (response?.success) {
                setEmployees(response.employees || []);
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchEmployeeUsers = async () => {
        setLoadingEmployeeUsers(true);
        try {
            const response = await callServicesApi({ action: "GET_ALL_USERS", session_id });
            if (response?.success) setEmployeeUsers(response.data || []);
        } catch (err) { console.error(err); }
        finally { setLoadingEmployeeUsers(false); }
    };

    const handleAddEmployee = async () => {
        if (!newEmployee.user_id || !employeesKennelId) {
            setErrorMsg("Please select a user."); return;
        }
        setSubmittingEmployee(true);
        try {
            const response = await callServicesApi({
                action: "ASSIGN_KENNEL_EMPLOYEE",
                session_id,
                kennel_id: parseInt(employeesKennelId),
                user_id: parseInt(newEmployee.user_id),
                can_manage_bookings: newEmployee.can_manage_bookings ? 1 : 0,
                can_manage_kennel: newEmployee.can_manage_kennel ? 1 : 0
            });
            if (response?.success) {
                setSuccessMsg("Employee added successfully.");
                setShowAddEmployee(false);
                setNewEmployee({ user_id: "", can_manage_bookings: false, can_manage_kennel: false });
                fetchKennelEmployees(employeesKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to add employee.");
            }
        } catch { setErrorMsg("Error adding employee."); }
        finally { setSubmittingEmployee(false); }
    };

    const handleRemoveEmployee = async (assignmentId) => {
        if (!window.confirm("Remove this employee?")) return;
        try {
            const response = await callServicesApi({
                action: "REMOVE_KENNEL_EMPLOYEE",
                session_id,
                assignment_id: assignmentId
            });
            if (response?.success) {
                setSuccessMsg("Employee removed.");
                fetchKennelEmployees(employeesKennelId);
            } else {
                setErrorMsg(response?.message || "Failed to remove employee.");
            }
        } catch { setErrorMsg("Error removing employee."); }
    };

    const fetchBookingNotes = async (bookingId) => {
        setLoadingNotes(true);
        try {
            const response = await callServicesApi({
                action: "GET_BOOKING_NOTES",
                session_id,
                booking_id: bookingId
            });
            if (response?.success) {
                setBookingNotes(response.notes || []);
            }
        } catch (err) {
            console.error("Error fetching notes:", err);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleAddNote = async (bookingId, noteType = "during_stay") => {
        if (!newNote.trim()) return;
        setSubmittingNote(true);
        try {
            const response = await callServicesApi({
                action: "ADD_BOOKING_NOTE",
                session_id,
                booking_id: bookingId,
                note: newNote.trim(),
                note_type: noteType,
                created_by: userData.id
            });
            if (response?.success) {
                setNewNote("");
                fetchBookingNotes(bookingId);
            } else {
                setErrorMsg(response?.message || "Failed to add note.");
            }
        } catch { setErrorMsg("Error adding note."); }
        finally { setSubmittingNote(false); }
    };

    const openNotesModal = (booking) => {
        setNotesBooking(booking);
        setBookingNotes([]);
        setNewNote("");
        setShowNotesModal(true);
        fetchBookingNotes(booking.booking_id);
    };

    const handleCheckInWithNote = async () => {
        if (!checkInBooking) return;
        setSubmittingCheckIn(true);
        try {
            const response = await callServicesApi({
                action: "UPDATE_BOOKING_STATUS",
                session_id,
                booking_id: checkInBooking.booking_id,
                new_status: "checked_in",
                note: checkInNote.trim(),
                created_by: userData.id
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                setShowCheckInModal(false);
                setCheckInBooking(null);
                setCheckInNote("");
                setBookingsCached(false);
                await fetchAllBookings(true);
            } else {
                setErrorMsg(response?.message || "Failed to check in.");
            }
        } catch { setErrorMsg("Error checking in."); }
        finally { setSubmittingCheckIn(false); }
    };

    const openCheckoutWithNotes = async (booking) => {
        setCheckoutNotesBooking(booking);
        setCheckoutNotes([]);
        setCheckoutNote("");
        setShowCheckoutNotesModal(true);
        setLoadingCheckoutNotes(true);
        try {
            const response = await callServicesApi({
                action: "GET_BOOKING_NOTES",
                session_id,
                booking_id: booking.booking_id
            });
            if (response?.success) {
                setCheckoutNotes(response.notes || []);
            }
        } catch (err) {
            console.error("Error fetching notes:", err);
        } finally {
            setLoadingCheckoutNotes(false);
        }
    };

    const handleProceedCheckout = async () => {
        setProcessingCheckout(true);
        // Save checkout note if provided
        if (checkoutNote.trim()) {
            await callServicesApi({
                action: "ADD_BOOKING_NOTE",
                session_id,
                booking_id: checkoutNotesBooking.booking_id,
                note: checkoutNote.trim(),
                note_type: "check_out",
                created_by: userData.id
            });
        }
        setShowCheckoutNotesModal(false);
        setProcessingCheckout(false);
        // Proceed with normal checkout flow (which may show pending payments modal)
        handleUpdateBookingStatus(checkoutNotesBooking.booking_id, "completed");
    };

    const openAdminCancelModal = async (booking) => {
        setAdminCancelBooking(booking);
        setAdminCancelPreview(null);
        setShowAdminCancelModal(true);
        setAdminCancelLoading(true);
        try {
            const response = await callServicesApi({
                action: "CANCEL_BOOKING",
                session_id,
                booking_id: booking.booking_id,
                refund_method: "wallet",
                preview: true
            });
            if (response?.success && response.preview) {
                setAdminCancelPreview(response);
            }
        } catch (err) {
            console.error("Error fetching cancel preview:", err);
        } finally {
            setAdminCancelLoading(false);
        }
    };

    const confirmAdminCancel = async () => {
        if (!adminCancelBooking) return;
        setAdminCancelProcessing(true);
        try {
            const response = await callServicesApi({
                action: "CANCEL_BOOKING",
                session_id,
                booking_id: adminCancelBooking.booking_id,
                refund_method: "wallet"
            });
            if (response?.success) {
                let msg = "Booking cancelled.";
                if (response.refund_summary?.wallet_refund > 0) {
                    msg += ` ₹${Math.round(response.refund_summary.wallet_refund)} refunded to customer's wallet.`;
                }
                if (response.refund_summary?.cancellation_fee > 0) {
                    msg += ` Cancellation fee: ₹${Math.round(response.refund_summary.cancellation_fee)}.`;
                }
                setSuccessMsg(msg);
                setBookingsCached(false);
                setExtensionsCached(false);
                await fetchAllBookings(true);
                setShowAdminCancelModal(false);
                setAdminCancelBooking(null);
                setAdminCancelPreview(null);
            } else {
                setErrorMsg(response?.message || "Failed to cancel booking.");
            }
        } catch { setErrorMsg("Error cancelling booking."); }
        finally { setAdminCancelProcessing(false); }
    };

    const handleUpdateBookingStatus = async (bookingId, newStatus, forceCheckout = false) => {
        setUpdatingBookingId(bookingId);
        try {
            const payload = {
                action: "UPDATE_BOOKING_STATUS",
                session_id,
                booking_id: bookingId,
                new_status: newStatus
            };
            if (forceCheckout) payload.force_checkout = true;

            const response = await callServicesApi(payload);

            if (response?.has_pending_payments && newStatus === "completed") {
                // Show checkout modal with pending payments
                const booking = allBookings.find(b => b.booking_id === bookingId);
                setCheckoutBooking(booking);
                setCheckoutPending(response);
                setShowCheckoutModal(true);
                setUpdatingBookingId(null);
                return;
            }

            if (response?.success) {
                setSuccessMsg(response.message);
                setBookingsCached(false);
                setExtensionsCached(false);
                await fetchAllBookings(true);
                setShowCheckoutModal(false);
                setCheckoutBooking(null);
                setCheckoutPending(null);
            } else {
                setErrorMsg(response?.message || "Failed to update status.");
            }
        } catch { setErrorMsg("Error updating booking status."); }
        finally { setUpdatingBookingId(null); setForcingCheckout(false); }
    };

    const handleForceCheckout = async () => {
        if (!checkoutBooking) return;
        setForcingCheckout(true);
        await handleUpdateBookingStatus(checkoutBooking.booking_id, "completed", true);
    };

    const handleResendCheckoutEmail = async (ext) => {
        setResendingCheckoutId(ext.id);
        try {
            const emailHtml = getExtensionPaymentEmailHtml({
                userName: checkoutBooking.first_name || "Guest",
                kennelName: checkoutBooking.kennel_name,
                bookingId: checkoutBooking.booking_id,
                originalCheckout: formatDate(ext.original_checkout),
                newCheckout: formatDate(ext.new_checkout),
                extraDays: ext.extra_days,
                amount: parseFloat(ext.amount).toFixed(2),
                paymentLink: ext.link_url
            });
            await callServicesApi({
                action: "SEND_EMAIL",
                session_id,
                email: checkoutBooking.email,
                subject: `Payment Reminder: Booking Extension #${checkoutBooking.booking_id}`,
                html: emailHtml
            });
            setSuccessMsg(`Reminder sent to ${checkoutBooking.email}`);
        } catch {
            setErrorMsg("Failed to send reminder email.");
        } finally {
            setResendingCheckoutId(null);
        }
    };

    const getNextDay = (dateStr) => {
        const d = new Date(dateStr); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0];
    };

    const fetchRoomOccupancy = async (forceRefresh = false) => {
        if (!occupancyKennelId || !occupancyDate) return;
        if (roomOccupancyCached && !forceRefresh) return;
        setLoadingRoomOccupancy(true);
        try {
            const response = await callServicesApi({
                action: "GET_ROOM_OCCUPANCY",
                session_id,
                kennel_id: parseInt(occupancyKennelId),
                check_in: occupancyDate,
                check_out: getNextDay(occupancyDate)
            });
            if (response?.success) {
                setRoomOccupancy(response.rooms || []);
                setRoomOccupancyCached(true);
            }
        } catch (err) {
            console.error("Error fetching room occupancy:", err);
        } finally {
            setLoadingRoomOccupancy(false);
        }
    };

    const fetchOccupancy = async () => {
        if (!occupancyKennelId || !occupancyDate) return;
        setLoadingOccupancy(true);
        try {
            const response = await callServicesApi({
                action: "GET_KENNEL_BOOKING",
                session_id,
                kennel_id: parseInt(occupancyKennelId),
                pet_count: 1,
                check_in: occupancyDate,
                check_out: getNextDay(occupancyDate)
            });
            if (response?.success) {
                setOccupancyData(response);
            }
        } catch (err) { console.error(err); }
        finally { setLoadingOccupancy(false); }
    };

    useEffect(() => {
        if (activeTab === "occupancy" && occupancyKennelId) {
            fetchOccupancy();
            setRoomOccupancyCached(false);
            if (occupancyView === "rooms") {
                fetchRoomOccupancy(true);
            }
        }
    }, [occupancyKennelId, occupancyDate, activeTab]);

    useEffect(() => {
        if (occupancyView === "rooms" && occupancyKennelId && occupancyDate) {
            fetchRoomOccupancy();
        }
    }, [occupancyView]);

    useEffect(() => {
        if (activeTab === "occupancy" && kennels.length > 0 && !occupancyKennelId) {
            setOccupancyKennelId(kennels[0].id);
            if (!calendarKennelId) setCalendarKennelId(kennels[0].id);
        }
    }, [activeTab, kennels]);

    // Today's activity computed from bookings
    const todayCheckIns = allBookings.filter(b =>
        b.check_in_date && new Date(b.check_in_date).toISOString().split("T")[0] === todayDate
        && (bookingsKennelFilter === "all" || b.kennel_id === parseInt(bookingsKennelFilter))
    );
    const todayCheckOuts = allBookings.filter(b =>
        b.check_out_date && new Date(b.check_out_date).toISOString().split("T")[0] === todayDate
        && (bookingsKennelFilter === "all" || b.kennel_id === parseInt(bookingsKennelFilter))
    );

    const getPetWeightCategory = (weight) => {
        if (!weight) return null;
        const w = weight.toLowerCase();
        if (w.includes("below 15") || w.includes("small")) return "small";
        if (w.includes("above 40") || w.includes("large")) return "large";
        return "medium";
    };

    const calculatePetPrice = (pet, roomType) => {
        if (!roomType || !pet) return 0;
        const category = getPetWeightCategory(pet.weight);
        if (category === "small") return parseFloat(roomType.price_small) || 0;
        if (category === "large") return parseFloat(roomType.price_large) || 0;
        return parseFloat(roomType.price_medium) || 0;
    };

    const manualDays = (() => {
        if (!manualCheckIn || !manualCheckOut) return 0;
        const d1 = new Date(manualCheckIn);
        const d2 = new Date(manualCheckOut);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    })();

    const manualTotal = (() => {
        if (!manualRoomType || manualSelectedPets.length === 0 || manualDays === 0) return 0;
        let total = 0;
        for (const petId of manualSelectedPets) {
            const pet = manualPets.find(p => p.id === petId);
            total += calculatePetPrice(pet, manualRoomType) * manualDays;
        }
        return Math.round(total * 100) / 100;
    })();

    const handleManualSubmit = async () => {
        if (!manualKennelInfo || !manualUser || !manualRoomType) {
            setErrorMsg("Please select kennel, user, and room type.");
            return;
        }
        if (manualSelectedPets.length === 0) {
            setErrorMsg("Please select at least one pet.");
            return;
        }
        if (!manualCheckIn || !manualCheckOut) {
            setErrorMsg("Please select check-in and check-out dates.");
            return;
        }
        if (manualDays <= 0) {
            setErrorMsg("Check-out must be after check-in.");
            return;
        }

        setManualSubmitting(true);
        try {
            const orderId = `MANUAL_${Date.now()}`;
            const petsPayload = manualSelectedPets.map((petId, idx) => {
                const pet = manualPets.find(p => p.id === petId);
                const pricePerDay = calculatePetPrice(pet, manualRoomType);
                return {
                    pet_id: petId,
                    price_per_day: Math.round(pricePerDay * 100) / 100,
                    total_price: Math.round(pricePerDay * manualDays * 100) / 100,
                    room_id: manualSelectedRooms[idx]?.room_id || null
                };
            });

            const response = await callServicesApi({
                action: "CREATE_BOOKING_ENTRY",
                session_id,
                user_id: manualUser.id,
                kennel_id: manualKennelInfo.id,
                room_type_id: manualRoomType.room_type_id,
                check_in_date: manualCheckIn,
                check_out_date: manualCheckOut,
                days: manualDays,
                total_price: manualTotal,
                mode: "offline",
                order_id: orderId,
                cf_order_id: null,
                pets: petsPayload
            });

            if (response?.success) {
                // Send confirmation email
                try {
                    const petDetails = manualSelectedPets.map(petId => {
                        const pet = manualPets.find(p => p.id === petId);
                        const pricePerDay = calculatePetPrice(pet, manualRoomType);
                        const markup = manualKennel?.markup ? (1 + parseFloat(manualKennel.markup) / 100) : 1;
                        return {
                            name: pet?.name || `Pet #${petId}`,
                            breed: pet?.breed || "-",
                            total: Math.round(pricePerDay * markup * manualDays * 100) / 100
                        };
                    });
                    const emailHtml = getBoardingBookingEmailHtml({
                        userName: manualUser.first_name || "Guest",
                        kennelName: manualKennelInfo.name,
                        checkIn: formatDate(manualCheckIn),
                        checkOut: formatDate(manualCheckOut),
                        days: manualDays,
                        pets: petDetails,
                        totalPrice: manualTotal,
                        orderId: orderId,
                        transactionId: "MANUAL"
                    });
                    await callServicesApi({
                        action: "SEND_EMAIL",
                        session_id,
                        email: manualUser.email,
                        subject: `Booking Confirmed: ${manualKennelInfo.name} - Wag N Wonder`,
                        html: emailHtml
                    });
                } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                }

                setSuccessMsg("Booking created successfully!");
                // Reset form
                setManualKennel(null);
                setManualKennelInfo(null);
                setManualUser(null);
                setManualUserQuery("");
                setUserLookupDone(false);
                setUserNotFound(false);
                setManualRoomType(null);
                setManualCheckIn("");
                setManualCheckOut("");
                setManualPets([]);
                setManualSelectedPets([]);
                setManualSelectedRooms([]);
                setManualRoomOccupancy([]);
                setBookingsCached(false);
            } else {
                setErrorMsg(response?.message || "Failed to create booking.");
            }
        } catch {
            setErrorMsg("Error creating booking.");
        } finally {
            setManualSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const permissions = getUserPermissions();

    // Auth guard
    if (!userData || !userData.permissions?.includes("boarding")) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
    }

    return (
        <div className="manage-events-page">
            {/* Header */}
            <div className="manage-events-header">
                <h2>
                    {activeTab === "kennels" && "My Kennels"}
                    {(activeTab === "bookings" || activeTab === "manual" || activeTab === "extensions") && "Bookings"}
                    {activeTab === "profile" && "Kennel Profile"}
                    {activeTab === "revenue" && "Earnings Dashboard"}
                    {activeTab === "today" && "Today's Activity"}
                    {activeTab === "occupancy" && "Occupancy"}
                    {activeTab === "employees" && "Employees"}
                    {activeTab === "closure" && "Maintenance Closure"}
                </h2>
            </div>
            {/* Closure Banners */}
            {closures.map(c => {
                const today = new Date().toISOString().split("T")[0];
                const isActive = today >= c.closure_start && today < c.closure_end;
                const isUpcoming = today < c.closure_start;
                if (!isActive && !isUpcoming) return null;
                return (
                    <div key={c.id} style={{
                        padding: "12px 20px",
                        borderRadius: "10px",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: isActive ? "linear-gradient(135deg, #fef2f2, #fee2e2)" : "linear-gradient(135deg, #fffbeb, #fef3c7)",
                        border: isActive ? "1px solid #fca5a5" : "1px solid #fcd34d"
                    }}>
                        <i className={`bi ${isActive ? "bi-exclamation-octagon-fill" : "bi-exclamation-triangle-fill"}`}
                            style={{ fontSize: "1.2rem", color: isActive ? "#dc2626" : "#d97706" }}></i>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, color: isActive ? "#991b1b" : "#92400e", fontSize: "0.9rem" }}>
                                {isActive
                                    ? `${c.kennel_name} is closed until ${formatDate(c.closure_end)}`
                                    : `${c.kennel_name} will close from ${formatDate(c.closure_start)} to ${formatDate(c.closure_end)}`
                                }
                            </span>
                            {c.reason && (
                                <span style={{ display: "block", fontSize: "0.8rem", color: isActive ? "#b91c1c" : "#a16207", marginTop: "2px" }}>
                                    Reason: {c.reason}
                                </span>
                            )}
                        </div>
                        {(permissions.isOwner || permissions.canManageKennel) && (
                            <button
                                onClick={() => handleCancelClosure(c.id)}
                                disabled={cancellingClosureId === c.id}
                                style={{
                                    padding: "6px 14px", borderRadius: "8px",
                                    border: "1px solid " + (isActive ? "#fca5a5" : "#fcd34d"),
                                    background: "white", color: isActive ? "#dc2626" : "#d97706",
                                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {cancellingClosureId === c.id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    "Revert Closure"
                                )}
                            </button>
                        )}
                    </div>
                );
            })}
            {/* Messages */}
            {successMsg && (
                <div className="manage-events-alert success">
                    <i className="bi bi-check-circle"></i> {successMsg}
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}
            {errorMsg && (
                <div className="manage-events-alert error">
                    <i className="bi bi-exclamation-circle"></i> {errorMsg}
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* ==================== MY KENNELS TAB ==================== */}
            {activeTab === "kennels" && (
                <>
                    <div className="events-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search kennels..."
                                value={searchKennel}
                                onChange={(e) => setSearchKennel(e.target.value)}
                            />
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => fetchManagedKennels(true)}
                            disabled={loadingKennels}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loadingKennels ? 'spinning' : ''}`}></i>
                        </button>
                    </div>
                    {loadingKennels ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : filteredKennels.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-house-door"></i>
                            <p>No kennels found</p>
                        </div>
                    ) : (
                        <div className="events-grid">
                            {filteredKennels.map(kennel => (
                                <div key={kennel.id} className="event-admin-card" onClick={() => handleKennelClick(kennel)}>
                                    <div className="event-admin-card-image">
                                        {kennel.image ? (
                                            <img src={kennel.image} alt={kennel.name} />
                                        ) : (
                                            <div className="event-admin-card-no-image">
                                                <i className="bi bi-house-door"></i>
                                            </div>
                                        )}
                                        <span className={`event-admin-card-status ${kennel.is_active ? 'upcoming' : 'past'}`}>
                                            {kennel.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="event-admin-card-body">
                                        <h4>{kennel.name}</h4>
                                        <p><i className="bi bi-geo-alt me-1"></i>{kennel.city}, {kennel.state}</p>
                                        <p><i className="bi bi-pin-map me-1"></i>{kennel.pin_code}</p>
                                        <div className="event-admin-card-stats">
                                            <span><i className="bi bi-door-open me-1"></i>{kennel.total_rooms} rooms</span>
                                            <span style={{ marginLeft: "12px" }}><i className="bi bi-calendar-check me-1"></i>{kennel.active_bookings} active</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ==================== PROFILE TAB ==================== */}
            {activeTab === "profile" && loadingKennels && (
                <div className="loading-spinner">
                    <div className="spinner-border" role="status"></div>
                </div>
            )}
            {activeTab === "profile" && !loadingKennels && !(permissions.isOwner || permissions.canManageKennel) && (
                <div className="empty-state">
                    <i className="bi bi-shield-lock"></i>
                    <p>You don't have access to manage kennel profiles</p>
                </div>
            )}
            {activeTab === "profile" && !loadingKennels && (permissions.isOwner || permissions.canManageKennel) && (
                <>
                    {/* Sub-tabs */}
                    <div className="manage-events-submenu" style={{ marginBottom: "16px" }}>
                        <button
                            className={`submenu-item ${profileTab === "pricing" ? "active" : ""}`}
                            onClick={() => setProfileTab("pricing")}
                        >
                            <i className="bi bi-currency-rupee"></i>
                            Pricing
                        </button>
                        <button
                            className={`submenu-item ${profileTab === "images" ? "active" : ""}`}
                            onClick={() => setProfileTab("images")}
                        >
                            <i className="bi bi-images"></i>
                            Photos
                        </button>
                        <button
                            className={`submenu-item ${profileTab === "features" ? "active" : ""}`}
                            onClick={() => setProfileTab("features")}
                        >
                            <i className="bi bi-stars"></i>
                            Features
                        </button>
                    </div>

                    <div className="events-filters">
                        {kennels.length > 1 && (
                            <div className="status-filter">
                                <select
                                    value={profileKennelId}
                                    onChange={(e) => setProfileKennelId(e.target.value)}
                                >
                                    {kennels.map(k => {
                                        const hasAccess = k.user_role === "owner" || k.can_manage_kennel;
                                        return (
                                            <option key={k.id} value={k.id} disabled={!hasAccess}>
                                                {k.name}{!hasAccess ? " (No access)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => fetchProfileData(profileKennelId)}
                            disabled={loadingProfile}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loadingProfile ? 'spinning' : ''}`}></i>
                        </button>
                    </div>

                    {loadingProfile ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : !profileData ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : (
                        <>
                            {/* ---- PRICING ---- */}
                            {profileTab === "pricing" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {editedPricing.map((room, idx) => (
                                        <div key={idx} style={{
                                            background: "white", borderRadius: "12px", padding: "20px",
                                            border: "1px solid #e2e8f0"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                                                    {room.room_type_name}
                                                </h4>
                                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{room.count} rooms</span>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>Small (below 15kg)</label>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>₹</span>
                                                        <input
                                                            type="number"
                                                            value={room.price_small}
                                                            onChange={(e) => {
                                                                const updated = [...editedPricing];
                                                                updated[idx].price_small = parseFloat(e.target.value) || 0;
                                                                setEditedPricing(updated);
                                                            }}
                                                            className="manual-entry-select"
                                                            style={{ paddingLeft: "28px" }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>Medium (15-40kg)</label>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>₹</span>
                                                        <input
                                                            type="number"
                                                            value={room.price_medium}
                                                            onChange={(e) => {
                                                                const updated = [...editedPricing];
                                                                updated[idx].price_medium = parseFloat(e.target.value) || 0;
                                                                setEditedPricing(updated);
                                                            }}
                                                            className="manual-entry-select"
                                                            style={{ paddingLeft: "28px" }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "6px" }}>Large (above 40kg)</label>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>₹</span>
                                                        <input
                                                            type="number"
                                                            value={room.price_large}
                                                            onChange={(e) => {
                                                                const updated = [...editedPricing];
                                                                updated[idx].price_large = parseFloat(e.target.value) || 0;
                                                                setEditedPricing(updated);
                                                            }}
                                                            className="manual-entry-select"
                                                            style={{ paddingLeft: "28px" }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {editedPricing.length > 0 && (
                                        <button
                                            className="manual-entry-submit"
                                            onClick={handleSavePricing}
                                            disabled={savingPricing}
                                            style={{ alignSelf: "flex-start" }}
                                        >
                                            {savingPricing ? (
                                                <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                                            ) : (
                                                <><i className="bi bi-check-circle"></i> Save Pricing</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ---- PHOTOS ---- */}
                            {profileTab === "images" && (
                                <div>
                                    {/* Upload button */}
                                    <div style={{
                                        background: "white", borderRadius: "12px", padding: "20px",
                                        border: "2px dashed #cbd5e1", textAlign: "center", marginBottom: "20px",
                                        cursor: uploadingImages ? "not-allowed" : "pointer",
                                        opacity: uploadingImages ? 0.6 : 1
                                    }}
                                        onClick={() => !uploadingImages && document.getElementById("profile-image-input").click()}
                                    >
                                        <input
                                            id="profile-image-input"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            style={{ display: "none" }}
                                        />
                                        {uploadingImages ? (
                                            <div>
                                                <div className="spinner-border spinner-border-sm" style={{ marginBottom: "8px" }}></div>
                                                <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                                    Uploading {imageUploadProgress.current} of {imageUploadProgress.total}...
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <i className="bi bi-cloud-arrow-up" style={{ fontSize: "2rem", color: "#94a3b8" }}></i>
                                                <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#64748b" }}>
                                                    Click to upload photos
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Existing images */}
                                    {profileData.images?.length === 0 ? (
                                        <div className="empty-state">
                                            <i className="bi bi-images"></i>
                                            <p>No photos added yet</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                                            {profileData.images.map((img, idx) => (
                                                <div key={idx} style={{
                                                    position: "relative", borderRadius: "12px", overflow: "hidden",
                                                    border: "1px solid #e2e8f0", aspectRatio: "4/3"
                                                }}>
                                                    <img
                                                        src={img.image_url}
                                                        alt={img.alt_text || "Kennel"}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveImage(img.image_url)}
                                                        disabled={removingImage === img.image_url}
                                                        style={{
                                                            position: "absolute", top: "8px", right: "8px",
                                                            width: "32px", height: "32px", borderRadius: "50%",
                                                            background: "rgba(220, 38, 38, 0.9)", color: "white",
                                                            border: "none", cursor: "pointer",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "0.85rem"
                                                        }}
                                                    >
                                                        {removingImage === img.image_url ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            <i className="bi bi-trash"></i>
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ---- FEATURES ---- */}
                            {profileTab === "features" && (
                                <div>
                                    {loadingFeatures ? (
                                        <div className="loading-spinner">
                                            <div className="spinner-border" role="status"></div>
                                        </div>
                                    ) : allFeatures.length === 0 ? (
                                        <div className="empty-state">
                                            <i className="bi bi-stars"></i>
                                            <p>No features available</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{
                                                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                                gap: "10px", marginBottom: "20px"
                                            }}>
                                                {allFeatures.map(f => {
                                                    const isSelected = selectedFeatureIds.includes(f.id);
                                                    return (
                                                        <div
                                                            key={f.id}
                                                            onClick={() => {
                                                                setSelectedFeatureIds(prev =>
                                                                    isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id]
                                                                );
                                                            }}
                                                            style={{
                                                                padding: "12px 16px", borderRadius: "10px",
                                                                border: isSelected ? "2px solid #1e293b" : "1px solid #e2e8f0",
                                                                background: isSelected ? "#f8fafc" : "white",
                                                                cursor: "pointer", transition: "all 0.2s",
                                                                display: "flex", alignItems: "center", gap: "10px"
                                                            }}
                                                        >
                                                            <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'}`}
                                                                style={{ color: isSelected ? "#1e293b" : "#cbd5e1", fontSize: "1.1rem" }}></i>
                                                            <span style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: isSelected ? 600 : 400 }}>
                                                                {f.name}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                className="manual-entry-submit"
                                                onClick={handleSaveFeatures}
                                                disabled={savingFeatures}
                                                style={{ alignSelf: "flex-start" }}
                                            >
                                                {savingFeatures ? (
                                                    <><span className="spinner-border spinner-border-sm"></span> Saving...</>
                                                ) : (
                                                    <><i className="bi bi-check-circle"></i> Save Features</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ==================== REVENUE TAB ==================== */}
            {activeTab === "revenue" && loadingKennels && (
                <div className="loading-spinner">
                    <div className="spinner-border" role="status"></div>
                </div>
            )}
            {activeTab === "revenue" && !loadingKennels && !(permissions.isOwner || permissions.canManageKennel) && (
                <div className="empty-state">
                    <i className="bi bi-shield-lock"></i>
                    <p>You don't have access to view revenue</p>
                </div>
            )}
            {activeTab === "revenue" && !loadingKennels && (permissions.isOwner || permissions.canManageKennel) && (() => {
                const DATE_RANGES = [
                    { value: "all_time", label: "All Time" },
                    { value: "this_week", label: "This Week" },
                    { value: "last_week", label: "Last Week" },
                    { value: "this_month", label: "This Month" },
                    { value: "last_month", label: "Last Month" },
                ];

                const profileKennelIds = new Set(profileKennels.map(k => k.id));

                const getDateBoundaries = () => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayOfWeek = today.getDay();
                    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const thisWeekStart = new Date(today);
                    thisWeekStart.setDate(today.getDate() - mondayOffset);
                    const lastWeekEnd = new Date(thisWeekStart);
                    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
                    const lastWeekStart = new Date(lastWeekEnd);
                    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
                    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastMonthEnd = new Date(thisMonthStart);
                    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
                    const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
                    return { today, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonthStart, lastMonthStart, lastMonthEnd };
                };
                const db = getDateBoundaries();

                const filterByDate = (booking, range) => {
                    const d = new Date(booking.created_at);
                    d.setHours(0, 0, 0, 0);
                    switch (range) {
                        case "this_week": return d >= db.thisWeekStart;
                        case "last_week": return d >= db.lastWeekStart && d <= db.lastWeekEnd;
                        case "this_month": return d >= db.thisMonthStart;
                        case "last_month": return d >= db.lastMonthStart && d <= db.lastMonthEnd;
                        default: return true;
                    }
                };

                // All valid bookings for this kennel admin
                const allValid = allBookings.filter(b =>
                    profileKennelIds.has(b.kennel_id) &&
                    (bookingsKennelFilter === "all" || b.kennel_id === parseInt(bookingsKennelFilter))
                );

                // Filtered by date + status
                const filtered = allValid.filter(b =>
                    ["booked", "completed", "checked_in", "no_show"].includes(b.status) && filterByDate(b, revDateRange)
                );
                const allFiltered = allValid.filter(b => filterByDate(b, revDateRange));

                // Summary
                const totalRevenue = filtered.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
                const onlineBookings = filtered.filter(b => b.mode === "online");
                const offlineBookings = filtered.filter(b => b.mode === "offline");
                const onlineRevenue = onlineBookings.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
                const offlineRevenue = offlineBookings.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);
                const avgValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;
                const totalDays = filtered.reduce((s, b) => s + parseInt(b.days || 0), 0);
                const avgStay = filtered.length > 0 ? totalDays / filtered.length : 0;

                // Comparisons (ignore date filter)
                const locFiltered = allValid.filter(b => ["booked", "completed", "checked_in", "no_show"].includes(b.status));
                const calcRev = (bookings, start, end) => bookings.filter(b => {
                    const d = new Date(b.created_at); d.setHours(0, 0, 0, 0);
                    return end ? (d >= start && d <= end) : d >= start;
                }).reduce((s, b) => s + parseFloat(b.total_price || 0), 0);

                const thisWeekRev = calcRev(locFiltered, db.thisWeekStart);
                const lastWeekRev = calcRev(locFiltered, db.lastWeekStart, db.lastWeekEnd);
                const thisMonthRev = calcRev(locFiltered, db.thisMonthStart);
                const lastMonthRev = calcRev(locFiltered, db.lastMonthStart, db.lastMonthEnd);
                const calcGrowth = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 1000) / 10;
                const weekGrowth = calcGrowth(thisWeekRev, lastWeekRev);
                const monthGrowth = calcGrowth(thisMonthRev, lastMonthRev);

                // Customer stats
                const userBookings = {};
                filtered.forEach(b => { if (!userBookings[b.user_id]) userBookings[b.user_id] = 0; userBookings[b.user_id]++; });
                const totalCustomers = Object.keys(userBookings).length;
                const repeatCustomers = Object.values(userBookings).filter(c => c > 1).length;

                // Status breakdown
                const statusBreakdown = {};
                allFiltered.forEach(b => {
                    if (!statusBreakdown[b.status]) statusBreakdown[b.status] = { status: b.status, count: 0, revenue: 0 };
                    statusBreakdown[b.status].count++;
                    statusBreakdown[b.status].revenue += parseFloat(b.total_price || 0);
                });

                // Mode breakdown
                const modeBreakdown = {};
                filtered.forEach(b => {
                    const m = b.mode || "unknown";
                    if (!modeBreakdown[m]) modeBreakdown[m] = { mode: m, count: 0, revenue: 0 };
                    modeBreakdown[m].count++;
                    modeBreakdown[m].revenue += parseFloat(b.total_price || 0);
                });

                // Room types
                const roomStats = {};
                filtered.forEach(b => {
                    const rt = b.room_type_name || "Unknown";
                    if (!roomStats[rt]) roomStats[rt] = { room_type: rt, booking_count: 0, revenue: 0 };
                    roomStats[rt].booking_count++;
                    roomStats[rt].revenue += parseFloat(b.total_price || 0);
                });

                // Pet types
                const petStats = {};
                filtered.forEach(b => {
                    (b.pets || []).forEach(p => {
                        const t = p.pet_type || "Unknown";
                        if (!petStats[t]) petStats[t] = { type: t, count: 0 };
                        petStats[t].count++;
                    });
                });

                // Daily revenue (30 days)
                const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); thirtyDaysAgo.setHours(0, 0, 0, 0);
                const dailyStats = {};
                locFiltered.filter(b => new Date(b.created_at) >= thirtyDaysAgo).forEach(b => {
                    const key = new Date(b.created_at).toISOString().split("T")[0];
                    if (!dailyStats[key]) dailyStats[key] = { date: key, revenue: 0, bookings: 0 };
                    dailyStats[key].revenue += parseFloat(b.total_price || 0);
                    dailyStats[key].bookings++;
                });
                const dailyRevenue = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
                const maxDaily = Math.max(...dailyRevenue.map(d => d.revenue), 1);

                // Kennel breakdown
                const kennelStats = {};
                filtered.forEach(b => {
                    if (!kennelStats[b.kennel_id]) kennelStats[b.kennel_id] = { name: b.kennel_name, count: 0, revenue: 0, online: 0, offline: 0 };
                    kennelStats[b.kennel_id].count++;
                    kennelStats[b.kennel_id].revenue += parseFloat(b.total_price || 0);
                    if (b.mode === "online") kennelStats[b.kennel_id].online++; else kennelStats[b.kennel_id].offline++;
                });

                // Offline collection
                const offlineOnly = filtered.filter(b => b.mode === "offline");
                const offlineTotal = offlineOnly.reduce((s, b) => s + parseFloat(b.total_price || 0), 0);

                const formatCurrency = (amount) => {
                    const num = parseFloat(amount) || 0;
                    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
                    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
                    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
                    return `₹${Math.round(num).toLocaleString("en-IN")}`;
                };

                const getGrowthClass = (g) => g > 0 ? "positive" : g < 0 ? "negative" : "neutral";

                const PieChart = ({ data, valueKey, labelKey, colors }) => {
                    const total = data.reduce((s, d) => s + d[valueKey], 0);
                    let cumulative = 0;
                    return (
                        <div className="pie-chart-container">
                            <div className="pie-chart-wrapper">
                                <svg viewBox="0 0 100 100" className="pie-chart-svg">
                                    {data.map((item, idx) => {
                                        const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
                                        const startAngle = (cumulative / 100) * 360;
                                        cumulative += pct;
                                        const endAngle = (cumulative / 100) * 360;
                                        const largeArc = pct > 50 ? 1 : 0;
                                        const sr = (startAngle - 90) * (Math.PI / 180);
                                        const er = (endAngle - 90) * (Math.PI / 180);
                                        const x1 = 50 + 40 * Math.cos(sr), y1 = 50 + 40 * Math.sin(sr);
                                        const x2 = 50 + 40 * Math.cos(er), y2 = 50 + 40 * Math.sin(er);
                                        const d = pct === 100
                                            ? "M 50 10 A 40 40 0 1 1 49.99 10 Z"
                                            : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                        return <path key={idx} d={d} fill={colors[idx % colors.length]} className="pie-slice" />;
                                    })}
                                </svg>
                            </div>
                            <div className="pie-chart-legend">
                                {data.map((item, idx) => {
                                    const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
                                    return (
                                        <div key={idx} className="pie-legend-item">
                                            <span className="pie-legend-color" style={{ background: colors[idx % colors.length] }}></span>
                                            <span className="pie-legend-label">{item[labelKey]}</span>
                                            <span className="pie-legend-value">{pct.toFixed(0)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                };

                return (
                    <>
                        {/* Filters */}
                        <div className="events-filters" style={{ marginBottom: "20px" }}>
                            <div className="status-filter">
                                <select value={revDateRange} onChange={(e) => setRevDateRange(e.target.value)}>
                                    {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            {kennels.length > 1 && (
                                <div className="status-filter">
                                    <select value={bookingsKennelFilter} onChange={(e) => setBookingsKennelFilter(e.target.value)}>
                                        <option value="all">All Kennels</option>
                                        {profileKennels.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {(revDateRange !== "all_time" || bookingsKennelFilter !== "all") && (
                                <button
                                    className="earnings-refresh-btn"
                                    onClick={() => { setRevDateRange("all_time"); setBookingsKennelFilter("all"); }}
                                    style={{ minWidth: "unset" }}
                                >
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            )}
                            <button
                                className="earnings-refresh-btn"
                                onClick={() => fetchAllBookings(true)}
                                disabled={loadingBookings}
                                style={{ marginLeft: "auto", minWidth: "unset" }}
                            >
                                <i className={`bi bi-arrow-clockwise ${loadingBookings ? 'spinning' : ''}`}></i>
                            </button>
                        </div>

                        {(loadingBookings || loadingKennels) ? (
                            <div className="loading-spinner"><div className="spinner-border" role="status"></div></div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="earnings-summary-grid">
                                    <div className="earnings-card summary-card">
                                        <div className="summary-card-icon revenue"><i className="bi bi-currency-rupee"></i></div>
                                        <div className="summary-card-content">
                                            <span className="summary-label">Total Revenue</span>
                                            <span className="summary-value">{formatCurrency(totalRevenue)}</span>
                                            <div className={`summary-growth ${getGrowthClass(monthGrowth)}`}>
                                                <i className={`bi bi-arrow-${monthGrowth >= 0 ? "up" : "down"}`}></i>
                                                {Math.abs(monthGrowth)}% vs last month
                                            </div>
                                        </div>
                                    </div>
                                    <div className="earnings-card summary-card">
                                        <div className="summary-card-icon profit"><i className="bi bi-globe"></i></div>
                                        <div className="summary-card-content">
                                            <span className="summary-label">Online Collection</span>
                                            <span className="summary-value">{formatCurrency(onlineRevenue)}</span>
                                            <span className="summary-subtext">{onlineBookings.length} booking{onlineBookings.length !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <div className="earnings-card summary-card">
                                        <div className="summary-card-icon payout"><i className="bi bi-shop"></i></div>
                                        <div className="summary-card-content">
                                            <span className="summary-label">Offline Collection</span>
                                            <span className="summary-value">{formatCurrency(offlineRevenue)}</span>
                                            <span className="summary-subtext">{offlineBookings.length} booking{offlineBookings.length !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                    <div className="earnings-card summary-card">
                                        <div className="summary-card-icon bookings"><i className="bi bi-calendar-check"></i></div>
                                        <div className="summary-card-content">
                                            <span className="summary-label">Total Bookings</span>
                                            <span className="summary-value">{filtered.length}</span>
                                            <span className="summary-subtext">Avg: {formatCurrency(avgValue)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Offline Collection Breakdown */}
                                {offlineOnly.length > 0 && Object.keys(kennelStats).length > 0 && (
                                    <div className="earnings-card" style={{ marginBottom: "1.5rem" }}>
                                        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #f1f5f9" }}>
                                            <div className="summary-card-icon" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", color: "#ea580c" }}>
                                                <i className="bi bi-shop"></i>
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Offline Collection</h3>
                                                <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Collected directly at the kennel</p>
                                            </div>
                                            <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                                <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ea580c" }}>{formatCurrency(offlineTotal)}</span>
                                                <span style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8" }}>{offlineOnly.length} booking{offlineOnly.length !== 1 ? "s" : ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Comparison Cards */}
                                <div className="earnings-comparison-grid">
                                    <div className="earnings-card comparison-card">
                                        <div className="comparison-header"><i className="bi bi-calendar-week"></i><span>Weekly</span></div>
                                        <div className="comparison-body">
                                            <div className="comparison-item"><span className="comparison-label">This Week</span><span className="comparison-value">{formatCurrency(thisWeekRev)}</span></div>
                                            <div className="comparison-item"><span className="comparison-label">Last Week</span><span className="comparison-value muted">{formatCurrency(lastWeekRev)}</span></div>
                                        </div>
                                        <div className={`comparison-growth ${getGrowthClass(weekGrowth)}`}>
                                            <i className={`bi bi-arrow-${weekGrowth >= 0 ? "up" : "down"}-circle-fill`}></i>
                                            <span>{weekGrowth >= 0 ? "+" : ""}{weekGrowth}%</span>
                                        </div>
                                    </div>
                                    <div className="earnings-card comparison-card">
                                        <div className="comparison-header"><i className="bi bi-calendar-month"></i><span>Monthly</span></div>
                                        <div className="comparison-body">
                                            <div className="comparison-item"><span className="comparison-label">This Month</span><span className="comparison-value">{formatCurrency(thisMonthRev)}</span></div>
                                            <div className="comparison-item"><span className="comparison-label">Last Month</span><span className="comparison-value muted">{formatCurrency(lastMonthRev)}</span></div>
                                        </div>
                                        <div className={`comparison-growth ${getGrowthClass(monthGrowth)}`}>
                                            <i className={`bi bi-arrow-${monthGrowth >= 0 ? "up" : "down"}-circle-fill`}></i>
                                            <span>{monthGrowth >= 0 ? "+" : ""}{monthGrowth}%</span>
                                        </div>
                                    </div>
                                    <div className="earnings-card comparison-card">
                                        <div className="comparison-header"><i className="bi bi-people"></i><span>Customers</span></div>
                                        <div className="comparison-body">
                                            <div className="comparison-item"><span className="comparison-label">Total</span><span className="comparison-value">{totalCustomers}</span></div>
                                            <div className="comparison-item"><span className="comparison-label">Repeat</span><span className="comparison-value highlight">{repeatCustomers}</span></div>
                                        </div>
                                        <div className="comparison-stat"><span>Avg Stay: {avgStay.toFixed(1)} days</span></div>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="earnings-charts-row">
                                    <div className="earnings-card chart-card">
                                        <div className="chart-card-header"><h3>Revenue Trend (Last 30 Days)</h3></div>
                                        <div className="chart-card-body">
                                            {dailyRevenue.length > 0 ? (
                                                <div className="line-chart">
                                                    {(() => {
                                                        const yLabels = [maxDaily, maxDaily * 0.5, 0];
                                                        return (
                                                            <>
                                                                <div className="line-chart-y-labels">
                                                                    {yLabels.map((v, i) => <span key={i}>{formatCurrency(v)}</span>)}
                                                                </div>
                                                                <div className="line-chart-main">
                                                                    <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="line-chart-svg">
                                                                        {(() => {
                                                                            const pts = dailyRevenue.map((d, i) => {
                                                                                const x = (i / (dailyRevenue.length - 1)) * 580 + 10;
                                                                                const y = maxDaily > 0 ? 170 - (d.revenue / maxDaily) * 150 : 170;
                                                                                return `${x},${y}`;
                                                                            }).join(" ");
                                                                            return (
                                                                                <>
                                                                                    <polygon points={`10,170 ${pts} 590,170`} className="line-chart-area" />
                                                                                    <polyline points={pts} className="line-chart-line" />
                                                                                    {dailyRevenue.map((d, i) => {
                                                                                        const x = (i / (dailyRevenue.length - 1)) * 580 + 10;
                                                                                        const y = maxDaily > 0 ? 170 - (d.revenue / maxDaily) * 150 : 170;
                                                                                        const tx = x < 45 ? 35 : x > 555 ? -35 : 0;
                                                                                        const ty = y < 40 ? 35 : -35;
                                                                                        return (
                                                                                            <g key={i} className="line-chart-point">
                                                                                                <circle cx={x} cy={y} r="16" className="line-chart-dot-hover" />
                                                                                                <circle cx={x} cy={y} r="4" className="line-chart-dot" />
                                                                                                <g className="line-chart-tooltip" transform={`translate(${x + tx}, ${y + ty})`}>
                                                                                                    <rect x="-35" y="-14" width="70" height="22" rx="4" />
                                                                                                    <text x="0" y="2" textAnchor="middle">{formatCurrency(d.revenue)}</text>
                                                                                                </g>
                                                                                            </g>
                                                                                        );
                                                                                    })}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </svg>
                                                                    <div className="line-chart-labels">
                                                                        {dailyRevenue.filter((_, i) => i % 6 === 0 || i === dailyRevenue.length - 1).map((d, i) => (
                                                                            <span key={i}>{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="chart-empty"><i className="bi bi-bar-chart"></i><p>No revenue data for this period</p></div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="earnings-card chart-card small">
                                        <div className="chart-card-header"><h3>Booking Status</h3></div>
                                        <div className="chart-card-body">
                                            {Object.keys(statusBreakdown).length > 0 ? (
                                                <div className="status-breakdown">
                                                    {Object.values(statusBreakdown).map((s, i) => {
                                                        const total = Object.values(statusBreakdown).reduce((sum, x) => sum + x.count, 0);
                                                        const pct = total > 0 ? (s.count / total) * 100 : 0;
                                                        return (
                                                            <div key={i} className={`status-item status-${s.status}`}>
                                                                <div className="status-info"><span className="status-name">{s.status}</span><span className="status-count">{s.count}</span></div>
                                                                <div className="status-bar-bg"><div className="status-bar" style={{ width: `${pct}%` }}></div></div>
                                                                <span className="status-revenue">{formatCurrency(s.revenue)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="chart-empty"><i className="bi bi-pie-chart"></i><p>No booking data</p></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Kennel Breakdown (if multiple) */}
                                {Object.keys(kennelStats).length > 1 && (
                                    <div className="earnings-card" style={{ marginBottom: "1.5rem" }}>
                                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                                            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Kennel-wise Breakdown</h3>
                                        </div>
                                        <div className="earnings-table-wrapper" style={{ padding: "0 16px 16px" }}>
                                            <table className="earnings-table">
                                                <thead><tr><th>Kennel</th><th>Bookings</th><th>Online</th><th>Offline</th><th>Revenue</th></tr></thead>
                                                <tbody>
                                                    {Object.values(kennelStats).sort((a, b) => b.revenue - a.revenue).map((k, i) => (
                                                        <tr key={i}>
                                                            <td className="kennel-name">{k.name}</td>
                                                            <td>{k.count}</td>
                                                            <td><span className="mode-badge mode-online">{k.online}</span></td>
                                                            <td><span className="mode-badge mode-offline">{k.offline}</span></td>
                                                            <td className="revenue">{formatCurrency(k.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Pie Charts Row */}
                                <div className="earnings-bottom-row">
                                    <div className="earnings-card info-card">
                                        <div className="info-card-header"><i className="bi bi-credit-card"></i><h3>Payment Modes</h3></div>
                                        <div className="info-card-body">
                                            {Object.keys(modeBreakdown).length > 0 ? (
                                                <PieChart data={Object.values(modeBreakdown)} valueKey="count" labelKey="mode" colors={["#059669", "#d97706", "#6366f1", "#ec4899"]} />
                                            ) : (<div className="info-empty">No payment data</div>)}
                                        </div>
                                    </div>
                                    <div className="earnings-card info-card">
                                        <div className="info-card-header"><i className="bi bi-heart"></i><h3>Pet Types</h3></div>
                                        <div className="info-card-body">
                                            {Object.keys(petStats).length > 0 ? (
                                                <PieChart data={Object.values(petStats)} valueKey="count" labelKey="type" colors={["#D84A39", "#471915", "#f97316", "#eab308", "#84cc16"]} />
                                            ) : (<div className="info-empty">No pet data</div>)}
                                        </div>
                                    </div>
                                    <div className="earnings-card info-card">
                                        <div className="info-card-header"><i className="bi bi-door-open"></i><h3>Room Types</h3></div>
                                        <div className="info-card-body">
                                            {Object.keys(roomStats).length > 0 ? (
                                                <PieChart data={Object.values(roomStats)} valueKey="booking_count" labelKey="room_type" colors={["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"]} />
                                            ) : (<div className="info-empty">No room data</div>)}
                                        </div>
                                    </div>
                                </div>

                                {filtered.length === 0 && (
                                    <div className="empty-state"><i className="bi bi-bar-chart"></i><p>No booking data available yet</p></div>
                                )}
                            </>
                        )}
                    </>
                );
            })()}

            {/* ==================== BOOKINGS TAB ==================== */}
            {(activeTab === "bookings" || activeTab === "manual" || activeTab === "extensions") && !permissions.canManageBookings && (
                <div className="empty-state">
                    <i className="bi bi-shield-lock"></i>
                    <p>You don't have access to manage bookings</p>
                </div>
            )}
            {(activeTab === "bookings" || activeTab === "manual" || activeTab === "extensions") && permissions.canManageBookings && (
                <>
                    {/* Bookings sub-tabs */}
                    {permissions.canManageBookings && (
                        <div className="manage-events-submenu" style={{ marginBottom: "16px" }}>
                            <button
                                className={`submenu-item ${activeTab === "bookings" ? "active" : ""}`}
                                onClick={() => navigate("/admin/kennels-admin/bookings", { replace: true })}
                            >
                                <i className="bi bi-calendar-check"></i>
                                View All Bookings
                            </button>
                            <button
                                className={`submenu-item ${activeTab === "manual" ? "active" : ""}`}
                                onClick={() => navigate("/admin/kennels-admin/manual", { replace: true })}
                            >
                                <i className="bi bi-pencil-square"></i>
                                Manual Booking
                            </button>
                            <button
                                className={`submenu-item ${activeTab === "extensions" ? "active" : ""}`}
                                onClick={() => navigate("/admin/kennels-admin/extensions", { replace: true })}
                            >
                                <i className="bi bi-credit-card"></i>
                                Extension Payments
                            </button>
                        </div>
                    )}

                    {activeTab === "bookings" && (
                        <>
                            <div className="events-filters">
                                <div className="search-box">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone, booking ID..."
                                        value={bookingsSearch}
                                        onChange={(e) => setBookingsSearch(e.target.value)}
                                    />
                                </div>
                                {kennels.length > 1 && (
                                    <div className="status-filter">
                                        <select
                                            value={bookingsKennelFilter}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "all") { setBookingsKennelFilter("all"); return; }
                                                const k = kennels.find(kn => kn.id === parseInt(val));
                                                if (k && (k.user_role === "owner" || k.can_manage_bookings)) {
                                                    setBookingsKennelFilter(val);
                                                }
                                            }}
                                        >
                                            <option value="all">All Kennels</option>
                                            {kennels.map(k => {
                                                const hasAccess = k.user_role === "owner" || k.can_manage_bookings;
                                                return (
                                                    <option key={k.id} value={k.id} disabled={!hasAccess}>
                                                        {k.name}{!hasAccess ? " (No access)" : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                )}
                                <div className="status-filter">
                                    <select
                                        value={bookingsStatusFilter}
                                        onChange={(e) => setBookingsStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="booked">Booked</option>
                                        <option value="checked_in">Checked In</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="no_show">No Show</option>
                                    </select>
                                </div>
                                <div className="status-filter">
                                    <select
                                        value={bookingsModeFilter}
                                        onChange={(e) => setBookingsModeFilter(e.target.value)}
                                    >
                                        <option value="all">All Modes</option>
                                        <option value="online">Online</option>
                                        <option value="offline">Offline</option>
                                        <option value="wallet">Wallet</option>
                                        <option value="partial">Wallet + Online</option>
                                    </select>
                                </div>
                                <button
                                    className="earnings-refresh-btn"
                                    onClick={() => fetchAllBookings(true)}
                                    disabled={loadingBookings}
                                    style={{ marginLeft: "auto", minWidth: "unset" }}
                                >
                                    <i className={`bi bi-arrow-clockwise ${loadingBookings ? 'spinning' : ''}`}></i>
                                </button>
                            </div>

                            {loadingBookings ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : filteredBookings.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bi bi-calendar-x"></i>
                                    <p>No bookings found</p>
                                </div>
                            ) : (() => {
                                const activeBookings = filteredBookings.filter(b => b.status === "booked" || b.status === "checked_in");
                                const completedBookings = filteredBookings.filter(b => b.status === "completed");
                                const cancelledBookings = filteredBookings.filter(b => b.status === "cancelled" || b.status === "no_show");

                                const BookingCard = ({ b }) => {
                                    const isCompleted = b.status === "completed";
                                    const isCancelled = b.status === "cancelled" || b.status === "no_show";
                                    const today = new Date().toISOString().split("T")[0];
                                    const checkIn = new Date(b.check_in_date).toISOString().split("T")[0];
                                    const checkOut = new Date(b.check_out_date).toISOString().split("T")[0];
                                    const isCheckedIn = b.status === "checked_in";
                                    const isOngoing = checkIn <= today && checkOut > today && !isCompleted && !isCancelled;
                                    const isUpcoming = checkIn > today && !isCompleted && !isCancelled;

                                    return (
                                        <div
                                            onClick={() => setSelectedBooking(b)}
                                            style={{
                                                borderRadius: "12px",
                                                border: "1px solid #e2e8f0",
                                                background: "white",
                                                cursor: "pointer",
                                                transition: "transform 0.15s, box-shadow 0.15s",
                                                overflow: "hidden",
                                                opacity: isCancelled ? 0.6 : 1
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                                        >
                                            <div style={{ padding: "18px 20px" }}>
                                                {/* Row 1: Guest info + Status */}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{
                                                            width: "38px", height: "38px", borderRadius: "10px",
                                                            background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontWeight: 700, fontSize: "0.85rem", color: "#475569", flexShrink: 0
                                                        }}>
                                                            {b.first_name?.charAt(0)}{b.last_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>
                                                                {b.first_name} {b.last_name}
                                                            </div>
                                                            <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                                                #{b.booking_id}
                                                                {!isCompleted && <> · <i className="bi bi-telephone me-1"></i>{b.phone_number}</>}
                                                                {kennels.length > 1 && <> · {b.kennel_name}</>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        padding: "4px 12px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em",
                                                        background: isCompleted ? "#d1fae5" : isCancelled ? "#fee2e2" : isCheckedIn ? "#dbeafe" : isOngoing ? "#e0e7ff" : "#f1f5f9",
                                                        color: isCompleted ? "#059669" : isCancelled ? "#dc2626" : isCheckedIn ? "#2563eb" : isOngoing ? "#4f46e5" : "#64748b"
                                                    }}>
                                                        {isCheckedIn ? "Checked In" : b.status === "no_show" ? "No Show" : isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                                    </span>
                                                </div>

                                                {/* Row 2: Stay details grid */}
                                                <div style={{
                                                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                                    gap: "2px", borderRadius: "10px", overflow: "hidden",
                                                    background: "#f8fafc", marginBottom: "14px"
                                                }}>
                                                    <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Check-in</div>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(b.check_in_date)}</div>
                                                    </div>
                                                    <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Check-out</div>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(b.check_out_date)}</div>
                                                    </div>
                                                    <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Room</div>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{b.room_type_name || "N/A"}</div>
                                                    </div>
                                                    <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Stay</div>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{b.days} night{b.days !== 1 ? "s" : ""}</div>
                                                    </div>
                                                </div>

                                                {/* Row 3: Pets + Actions + Price */}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
                                                        {b.pets?.map((p, i) => (
                                                            <span key={i} style={{
                                                                display: "inline-flex", alignItems: "center", gap: "4px",
                                                                padding: "3px 10px", borderRadius: "20px",
                                                                fontSize: "0.75rem", fontWeight: 500,
                                                                background: "#f1f5f9", color: "#475569",
                                                                border: "1px solid #e2e8f0"
                                                            }}>
                                                                <i className="bi bi-heart-pulse-fill" style={{ fontSize: "0.65rem", color: p.pet_aggression === "high" ? "#dc2626" : p.pet_aggression === "moderate" ? "#d97706" : "#16a34a" }}></i>
                                                                {p.pet_name}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                                                        {!isCompleted && !isCancelled && (
                                                            <div style={{ display: "flex", gap: "6px" }}>
                                                                {b.status === "booked" && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setCheckInBooking(b); setCheckInNote(""); setShowCheckInModal(true); }}
                                                                        style={{
                                                                            padding: "5px 12px", borderRadius: "8px", border: "1px solid #dbeafe",
                                                                            background: "#eff6ff", color: "#2563eb", fontSize: "0.75rem",
                                                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                                            transition: "all 0.2s", whiteSpace: "nowrap"
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-box-arrow-in-right"></i> Check In
                                                                    </button>
                                                                )}
                                                                {b.status === "checked_in" && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openNotesModal(b); }}
                                                                        style={{
                                                                            padding: "5px 12px", borderRadius: "8px", border: "1px solid #e2e8f0",
                                                                            background: "#f8fafc", color: "#475569", fontSize: "0.75rem",
                                                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                                            transition: "all 0.2s", whiteSpace: "nowrap"
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-journal-text"></i> Notes
                                                                    </button>
                                                                )}
                                                                {b.status === "checked_in" && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openExtendModal(b); }}
                                                                        style={{
                                                                            padding: "5px 12px", borderRadius: "8px", border: "1px solid #fde68a",
                                                                            background: "#fffbeb", color: "#d97706", fontSize: "0.75rem",
                                                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                                            transition: "all 0.2s", whiteSpace: "nowrap"
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-calendar-plus"></i> Extend
                                                                    </button>
                                                                )}
                                                                {b.status === "checked_in" && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openCheckoutWithNotes(b); }}
                                                                        disabled={updatingBookingId === b.booking_id}
                                                                        style={{
                                                                            padding: "5px 12px", borderRadius: "8px", border: "1px solid #d1fae5",
                                                                            background: "#f0fdf4", color: "#059669", fontSize: "0.75rem",
                                                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                                            transition: "all 0.2s", whiteSpace: "nowrap"
                                                                        }}
                                                                    >
                                                                        {updatingBookingId === b.booking_id ? (
                                                                            <span className="spinner-border spinner-border-sm"></span>
                                                                        ) : (
                                                                            <><i className="bi bi-check-lg"></i> Check Out</>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {b.status === "booked" && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); openAdminCancelModal(b); }}
                                                                        disabled={updatingBookingId === b.booking_id}
                                                                        style={{
                                                                            padding: "5px 12px", borderRadius: "8px", border: "1px solid #fee2e2",
                                                                            background: "#fef2f2", color: "#dc2626", fontSize: "0.75rem",
                                                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                                            transition: "all 0.2s", whiteSpace: "nowrap"
                                                                        }}
                                                                    >
                                                                        <i className="bi bi-x-lg"></i> Cancel
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div style={{ textAlign: "right", minWidth: "70px" }}>
                                                            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>₹{b.total_price}</div>
                                                            <span className={`mode-badge ${b.mode === 'wallet' ? 'mode-wallet' : b.mode === 'partial' ? 'mode-partial' : b.mode === 'online' ? 'mode-online' : 'mode-offline'}`} style={{ marginLeft: 0 }}>{b.mode === 'partial' ? 'Wallet + Online' : b.mode.charAt(0).toUpperCase() + b.mode.slice(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                };

                                const SectionHeader = ({ icon, title, count, color }) => (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        marginBottom: "14px", marginTop: "8px"
                                    }}>
                                        <div style={{
                                            width: "32px", height: "32px", borderRadius: "8px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: color + "18", color: color
                                        }}>
                                            <i className={`bi ${icon}`} style={{ fontSize: "0.95rem" }}></i>
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>{title}</h4>
                                        <span style={{
                                            padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                                            background: color + "18", color: color
                                        }}>
                                            {count}
                                        </span>
                                    </div>
                                );

                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {/* Active Bookings */}
                                        {activeBookings.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-calendar-check-fill" title="Active Bookings" count={activeBookings.length} color="#2563eb" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                                                    {activeBookings.map(b => <BookingCard key={b.booking_id} b={b} />)}
                                                </div>
                                            </>
                                        )}

                                        {/* Completed Bookings */}
                                        {completedBookings.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-check-circle-fill" title="Completed" count={completedBookings.length} color="#059669" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                                                    {completedBookings.map(b => <BookingCard key={b.booking_id} b={b} />)}
                                                </div>
                                            </>
                                        )}

                                        {/* Cancelled Bookings */}
                                        {cancelledBookings.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-x-circle-fill" title="Cancelled" count={cancelledBookings.length} color="#dc2626" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {cancelledBookings.map(b => <BookingCard key={b.booking_id} b={b} />)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {/* Manual Entry (sub-tab of Bookings) */}
                    {activeTab === "manual" && permissions.canManageBookings && (
                        <div className="manual-entry-section">
                            <div className="manual-entry-form">
                                {/* Step 1: Select Kennel */}
                                <div className="manual-entry-step">
                                    <div className="step-header">
                                        <span className="step-number">1</span>
                                        <h4>Select Kennel</h4>
                                    </div>
                                    <div className="step-content">
                                        {kennels.filter(k => k.can_manage_bookings).length === 1 ? (
                                            (() => {
                                                const k = kennels.filter(kn => kn.can_manage_bookings)[0];
                                                if (!manualKennel) handleManualKennelSelect(k.id);
                                                return (
                                                    <div className="manual-entry-select" style={{ background: "#f8fafc", cursor: "default" }}>
                                                        {k.name} — {k.city}, {k.state}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <select
                                                value={manualKennel?.id || ""}
                                                onChange={(e) => handleManualKennelSelect(e.target.value)}
                                                className="manual-entry-select"
                                                disabled={loadingManualKennel}
                                            >
                                                <option value="">Choose a kennel...</option>
                                                {kennels.filter(k => k.can_manage_bookings).map(k => (
                                                    <option key={k.id} value={k.id}>
                                                        {k.name} — {k.city}, {k.state}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Find User */}
                                {manualKennelInfo && (
                                    <div className="manual-entry-step">
                                        <div className="step-header">
                                            <span className="step-number">2</span>
                                            <h4>Find User</h4>
                                        </div>
                                        <div className="step-content">
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <input
                                                    type="text"
                                                    value={manualUserQuery}
                                                    onChange={(e) => {
                                                        setManualUserQuery(e.target.value);
                                                        if (userLookupDone) {
                                                            setUserLookupDone(false);
                                                            setUserNotFound(false);
                                                            setManualUser(null);
                                                            setManualSelectedPets([]);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === "Enter") handleUserLookup(); }}
                                                    placeholder="Enter email or phone number"
                                                    className="manual-entry-select"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    onClick={handleUserLookup}
                                                    disabled={lookingUpUser || !manualUserQuery.trim()}
                                                    style={{
                                                        padding: "10px 20px", borderRadius: "10px", border: "1px solid #1e293b",
                                                        background: "#1e293b", color: "white", fontSize: "0.85rem",
                                                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                                        display: "flex", alignItems: "center", gap: "6px"
                                                    }}
                                                >
                                                    {lookingUpUser ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <><i className="bi bi-search"></i> Search</>
                                                    )}
                                                </button>
                                            </div>

                                            {/* User found */}
                                            {userLookupDone && manualUser && (
                                                <div style={{
                                                    marginTop: "12px", padding: "14px 16px", borderRadius: "10px",
                                                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                                                    display: "flex", alignItems: "center", justifyContent: "space-between"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{
                                                            width: "36px", height: "36px", borderRadius: "8px",
                                                            background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontWeight: 700, fontSize: "0.8rem", color: "#059669"
                                                        }}>
                                                            {manualUser.first_name?.charAt(0)}{manualUser.last_name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                                                {manualUser.first_name} {manualUser.last_name}
                                                            </div>
                                                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                                {manualUser.email} · {manualUser.phone_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <i className="bi bi-check-circle-fill" style={{ color: "#059669", fontSize: "1.2rem" }}></i>
                                                </div>
                                            )}

                                            {/* User not found */}
                                            {userLookupDone && userNotFound && (
                                                <div style={{
                                                    marginTop: "12px", padding: "14px 16px", borderRadius: "10px",
                                                    background: "#fffbeb", border: "1px solid #fde68a"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
                                                            <i className="bi bi-info-circle me-2"></i>
                                                            No user found. Would you like to register a new user?
                                                        </div>
                                                        <button
                                                            onClick={() => setShowAddUserModal(true)}
                                                            style={{
                                                                padding: "6px 14px", borderRadius: "8px", border: "1px solid #1e293b",
                                                                background: "#1e293b", color: "white", fontSize: "0.8rem",
                                                                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                                                display: "flex", alignItems: "center", gap: "4px"
                                                            }}
                                                        >
                                                            <i className="bi bi-person-plus"></i> Add User
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Select Pets */}
                                {manualUser && (
                                    <div className="manual-entry-step">
                                        <div className="step-header">
                                            <span className="step-number">3</span>
                                            <h4>Select Pets ({manualSelectedPets.length} selected)</h4>
                                        </div>
                                        <div className="step-content">
                                            {loadingManualPets ? (
                                                <div className="manual-entry-loading">
                                                    <div className="spinner-border spinner-border-sm"></div>
                                                </div>
                                            ) : manualPets.length === 0 ? (
                                                <div className="manual-entry-no-pets">
                                                    <p>No pets found for this user.</p>
                                                    <button onClick={() => setShowAddPetModal(true)}>
                                                        <i className="bi bi-plus"></i> Add Pet
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="manual-entry-pets">
                                                    {manualPets.map(pet => (
                                                        <button
                                                            key={pet.id}
                                                            className={`pet-select-btn ${manualSelectedPets.includes(pet.id) ? 'selected' : ''}`}
                                                            onClick={() => handleManualPetToggle(pet.id)}
                                                        >
                                                            <i className={`bi ${manualSelectedPets.includes(pet.id) ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                                            <div className="pet-info">
                                                                <span className="pet-name">{pet.name}</span>
                                                                <span className="pet-breed">{pet.breed} · {pet.weight || "Unknown weight"}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <button className="pet-add-btn" onClick={() => setShowAddPetModal(true)}>
                                                        <i className="bi bi-plus"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Select Dates */}
                                {manualSelectedPets.length > 0 && manualKennelInfo && (
                                    <div className="manual-entry-step">
                                        <div className="step-header">
                                            <span className="step-number">4</span>
                                            <h4>Select Dates</h4>
                                        </div>
                                        <div className="step-content">
                                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                                <div style={{ flex: 1, minWidth: "180px" }}>
                                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Check-in</label>
                                                    <input
                                                        type="date"
                                                        value={manualCheckIn}
                                                        min={new Date().toISOString().split("T")[0]}
                                                        onChange={(e) => {
                                                            setManualCheckIn(e.target.value);
                                                            if (manualCheckOut && e.target.value >= manualCheckOut) {
                                                                setManualCheckOut("");
                                                                setManualAvailability(null);
                                                                setManualRoomType(null);
                                                            } else if (manualCheckOut) {
                                                                fetchManualAvailability(manualKennelInfo.id, e.target.value, manualCheckOut);
                                                            }
                                                        }}
                                                        className="manual-entry-select"
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: "180px" }}>
                                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Check-out</label>
                                                    <input
                                                        type="date"
                                                        value={manualCheckOut}
                                                        min={manualCheckIn || new Date().toISOString().split("T")[0]}
                                                        onChange={(e) => {
                                                            setManualCheckOut(e.target.value);
                                                            if (manualCheckIn && e.target.value) {
                                                                fetchManualAvailability(manualKennelInfo.id, manualCheckIn, e.target.value);
                                                            }
                                                        }}
                                                        className="manual-entry-select"
                                                        disabled={!manualCheckIn}
                                                    />
                                                </div>
                                            </div>
                                            {manualDays > 0 && (
                                                <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#64748b" }}>
                                                    {manualDays} night{manualDays !== 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 5: Select Room Type (based on availability) */}
                                {manualDays > 0 && manualAvailability && (
                                    <div className="manual-entry-step">
                                        <div className="step-header">
                                            <span className="step-number">5</span>
                                            <h4>Select Room Type</h4>
                                        </div>
                                        <div className="step-content">
                                            {loadingManualAvailability ? (
                                                <div className="manual-entry-loading">
                                                    <div className="spinner-border spinner-border-sm"></div>
                                                </div>
                                            ) : manualAvailability.filter(rt => parseInt(rt.available_rooms) >= manualSelectedPets.length).length === 0 ? (
                                                <div style={{ padding: "16px", background: "#fef2f2", borderRadius: "10px", color: "#dc2626", fontSize: "0.9rem" }}>
                                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                                    No room types have enough availability for {manualSelectedPets.length} pet{manualSelectedPets.length !== 1 ? "s" : ""} on these dates.
                                                </div>
                                            ) : (
                                                <div className="manual-entry-tiers">
                                                    {manualAvailability.map((rt, idx) => {
                                                        const available = parseInt(rt.available_rooms);
                                                        const hasSpace = available >= manualSelectedPets.length;
                                                        return (
                                                            <button
                                                                key={idx}
                                                                className={`tier-btn ${manualRoomType?.room_type_id === rt.room_type_id ? 'selected' : ''}`}
                                                                onClick={() => { if (hasSpace) { setManualRoomType(rt); setManualSelectedRooms([]); setManualRoomOccupancy([]); } }}
                                                                disabled={!hasSpace}
                                                                style={!hasSpace ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                                                            >
                                                                <span className="tier-label">{rt.room_type}</span>
                                                                <span className="tier-price" style={{ color: hasSpace ? "#059669" : "#dc2626" }}>
                                                                    {available} available
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 6: Select Room (optional) */}
                                {manualRoomType && manualCheckIn && manualCheckOut && manualDays > 0 && (
                                    <div className="manual-entry-step">
                                        <div className="step-header">
                                            <span className="step-number">6</span>
                                            <h4>Select Room <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#94a3b8" }}>(optional — auto-assigned if skipped)</span></h4>
                                        </div>
                                        <div className="step-content">
                                            {manualRoomOccupancy.length === 0 && !loadingManualRooms ? (
                                                <button
                                                    onClick={fetchManualRoomOccupancy}
                                                    style={{
                                                        padding: "10px 20px", borderRadius: "10px", border: "1px solid #e2e8f0",
                                                        background: "white", color: "#475569", fontSize: "0.85rem",
                                                        fontWeight: 600, cursor: "pointer", display: "flex",
                                                        alignItems: "center", gap: "6px"
                                                    }}
                                                >
                                                    <i className="bi bi-grid-3x3"></i> Load Room Layout
                                                </button>
                                            ) : loadingManualRooms ? (
                                                <div className="manual-entry-loading">
                                                    <div className="spinner-border spinner-border-sm"></div>
                                                </div>
                                            ) : (() => {
                                                const typeRooms = manualRoomOccupancy.filter(
                                                    r => r.room_type_id === manualRoomType.room_type_id
                                                );
                                                if (typeRooms.length === 0) {
                                                    return (
                                                        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "0.9rem" }}>
                                                            No rooms found for this room type.
                                                        </div>
                                                    );
                                                }

                                                const petsToAssign = manualSelectedPets.length;

                                                return (
                                                    <div>
                                                        {/* Legend */}
                                                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.78rem", color: "#64748b", marginBottom: "14px" }}>
                                                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", border: "1px solid #6ee7b7" }}></span>
                                                                Available
                                                            </span>
                                                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "1px solid #fca5a5" }}></span>
                                                                Occupied
                                                            </span>
                                                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                                <span style={{ width: "12px", height: "12px", borderRadius: "4px", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", border: "1px solid #93c5fd" }}></span>
                                                                Selected
                                                            </span>
                                                        </div>

                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                                                            {typeRooms.map(room => {
                                                                const isOccupied = room.is_occupied;
                                                                const isSelected = manualSelectedRooms.some(r => r.room_id === room.room_id);
                                                                const canSelect = !isOccupied && (isSelected || manualSelectedRooms.length < petsToAssign);

                                                                return (
                                                                    <div
                                                                        key={room.room_id}
                                                                        onClick={() => {
                                                                            if (isOccupied) return;
                                                                            if (isSelected) {
                                                                                setManualSelectedRooms(prev => prev.filter(r => r.room_id !== room.room_id));
                                                                            } else if (canSelect) {
                                                                                setManualSelectedRooms(prev => [...prev, room]);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            borderRadius: "10px",
                                                                            border: isSelected ? "2px solid #3b82f6" : isOccupied ? "1px solid #fca5a5" : "1px solid #6ee7b7",
                                                                            background: isSelected
                                                                                ? "linear-gradient(135deg, #eff6ff, #dbeafe)"
                                                                                : isOccupied
                                                                                    ? "linear-gradient(135deg, #fff5f5, #fee2e2)"
                                                                                    : "linear-gradient(135deg, #f0fdf4, #d1fae5)",
                                                                            padding: "14px",
                                                                            cursor: isOccupied ? "not-allowed" : canSelect || isSelected ? "pointer" : "default",
                                                                            opacity: isOccupied ? 0.6 : (!canSelect && !isSelected) ? 0.5 : 1,
                                                                            transition: "all 0.2s",
                                                                            textAlign: "center"
                                                                        }}
                                                                    >
                                                                        <i className={`bi ${isSelected ? "bi-check-circle-fill" : isOccupied ? "bi-door-closed-fill" : "bi-door-open"}`}
                                                                            style={{ fontSize: "1.2rem", color: isSelected ? "#3b82f6" : isOccupied ? "#dc2626" : "#059669", display: "block", marginBottom: "4px" }}></i>
                                                                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
                                                                            Room {room.display_number}
                                                                        </span>
                                                                        {isOccupied && room.booking && (
                                                                            <span style={{ display: "block", fontSize: "0.68rem", color: "#dc2626", marginTop: "2px" }}>
                                                                                {room.booking.pet_name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {manualSelectedRooms.length > 0 && (
                                                            <div style={{ marginTop: "12px", fontSize: "0.85rem", color: "#475569" }}>
                                                                <i className="bi bi-check-circle me-1" style={{ color: "#3b82f6" }}></i>
                                                                {manualSelectedRooms.length} of {petsToAssign} room{petsToAssign !== 1 ? "s" : ""} selected
                                                                <button
                                                                    onClick={() => setManualSelectedRooms([])}
                                                                    style={{
                                                                        marginLeft: "12px", padding: "2px 8px", borderRadius: "6px",
                                                                        border: "1px solid #e2e8f0", background: "white",
                                                                        color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Summary & Submit */}
                                {manualRoomType && manualCheckIn && manualCheckOut && manualDays > 0 && (
                                    <div className="manual-entry-summary">
                                        <div className="summary-details">
                                            <div className="summary-row">
                                                <span>Kennel</span>
                                                <span>{manualKennelInfo?.name}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span>Guest</span>
                                                <span>{manualUser?.first_name} {manualUser?.last_name}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span>Pets</span>
                                                <span>{manualSelectedPets.map(id => manualPets.find(p => p.id === id)?.name).join(", ")}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span>Dates</span>
                                                <span>{formatDate(manualCheckIn)} → {formatDate(manualCheckOut)} ({manualDays} nights)</span>
                                            </div>
                                            <div className="summary-row total">
                                                <span>Total</span>
                                                <span>₹{manualTotal}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="manual-entry-submit"
                                            onClick={handleManualSubmit}
                                            disabled={manualSubmitting}
                                        >
                                            {manualSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                    Creating Booking...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle"></i>
                                                    Create Booking
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Extensions tab */}
                    {activeTab === "extensions" && permissions.canManageBookings && (
                        <>
                            <div className="events-filters">
                                <div className="search-box">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone..."
                                        value={extensionsSearch}
                                        onChange={(e) => setExtensionsSearch(e.target.value)}
                                    />
                                </div>
                                {kennels.length > 1 && (
                                    <div className="status-filter">
                                        <select
                                            value={bookingsKennelFilter}
                                            onChange={(e) => setBookingsKennelFilter(e.target.value)}
                                        >
                                            <option value="all">All Kennels</option>
                                            {bookingKennels.map(k => (
                                                <option key={k.id} value={k.id}>{k.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <button
                                    className="earnings-refresh-btn"
                                    onClick={() => fetchExtensions(true)}
                                    disabled={loadingExtensions}
                                    style={{ marginLeft: "auto", minWidth: "unset" }}
                                >
                                    <i className={`bi bi-arrow-clockwise ${loadingExtensions ? 'spinning' : ''}`}></i>
                                </button>
                            </div>

                            {loadingExtensions ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : (() => {
                                const filtered = extensions.filter(ext => {
                                    if (bookingsKennelFilter !== "all" && ext.kennel_id !== parseInt(bookingsKennelFilter)) return false;
                                    if (extensionsSearch.trim()) {
                                        const s = extensionsSearch.toLowerCase();
                                        return (
                                            ext.first_name?.toLowerCase().includes(s) ||
                                            ext.last_name?.toLowerCase().includes(s) ||
                                            ext.email?.toLowerCase().includes(s) ||
                                            ext.phone_number?.includes(s) ||
                                            ext.booking_id?.toString().includes(s)
                                        );
                                    }
                                    return true;
                                });
                                const unpaid = filtered.filter(ext => ext.payment_status === "pending");
                                const paid = filtered.filter(ext => ext.payment_status === "paid");
                                const expired = filtered.filter(ext => ext.payment_status === "expired" || ext.payment_status === "cancelled");

                                if (filtered.length === 0) {
                                    return (
                                        <div className="empty-state">
                                            <i className="bi bi-credit-card"></i>
                                            <p>No extension payments found</p>
                                        </div>
                                    );
                                }

                                const ExtensionCard = ({ ext, isPaid, isExpired = false }) => (
                                    <div style={{
                                        borderRadius: "12px",
                                        border: isExpired ? "1px solid #fecaca" : isPaid ? "1px solid #d1fae5" : "1px solid #fde68a",
                                        background: "white",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{ padding: "18px 20px" }}>
                                            {/* Row 1: Guest + Status */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: "38px", height: "38px", borderRadius: "10px",
                                                        background: isExpired ? "#fee2e2" : isPaid ? "#d1fae5" : "#fef3c7",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 700, fontSize: "0.85rem",
                                                        color: isExpired ? "#dc2626" : isPaid ? "#059669" : "#d97706", flexShrink: 0
                                                    }}>
                                                        {ext.first_name?.charAt(0)}{ext.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>
                                                            {ext.first_name} {ext.last_name}
                                                        </div>
                                                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                                            Booking #{ext.booking_id}
                                                            {kennels.length > 1 && <> · {ext.kennel_name}</>}
                                                            {!isPaid && <> · <i className="bi bi-telephone me-1"></i>{ext.phone_number}</>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: "4px 12px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600,
                                                    background: isExpired ? "#fee2e2" : isPaid ? "#d1fae5" : "#fef3c7",
                                                    color: isExpired ? "#dc2626" : isPaid ? "#059669" : "#d97706"
                                                }}>
                                                    {isExpired ? (ext.payment_status === "expired" ? "Expired" : "Cancelled") : isPaid ? "Paid" : "Awaiting Payment"}
                                                </span>
                                            </div>

                                            {/* Row 2: Extension details */}
                                            <div style={{
                                                display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
                                                gap: "2px", borderRadius: "10px", overflow: "hidden",
                                                background: "#f8fafc", marginBottom: "14px"
                                            }}>
                                                <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Original Checkout</div>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(ext.original_checkout_date)}</div>
                                                </div>
                                                <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>New Checkout</div>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(ext.new_checkout_date)}</div>
                                                </div>
                                                <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Extra Days</div>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{ext.extra_days} night{ext.extra_days !== 1 ? "s" : ""}</div>
                                                </div>
                                                <div style={{ padding: "10px 12px", background: "#f8fafc" }}>
                                                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{isPaid ? "Paid On" : "Requested"}</div>
                                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formatDate(isPaid ? ext.paid_at : ext.created_at)}</div>
                                                </div>
                                            </div>

                                            {/* Row 3: Amount + mode + link */}
                                            {/* Row 3: Amount + mode + link + resend */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span className={`mode-badge ${ext.payment_mode === 'online' ? 'mode-online' : 'mode-offline'}`}>
                                                        {ext.payment_mode}
                                                    </span>
                                                    {!isPaid && !isExpired && ext.link_url && (
                                                        <a
                                                            href={ext.link_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                padding: "4px 10px", borderRadius: "8px",
                                                                border: "1px solid #dbeafe", background: "#eff6ff",
                                                                color: "#2563eb", fontSize: "0.75rem", fontWeight: 600,
                                                                textDecoration: "none", display: "inline-flex",
                                                                alignItems: "center", gap: "4px"
                                                            }}
                                                        >
                                                            <i className="bi bi-link-45deg"></i> Payment Link
                                                        </a>
                                                    )}
                                                    {!isPaid && !isExpired && (
                                                        <button
                                                            onClick={() => handleResendExtensionEmail(ext)}
                                                            disabled={resendingExtensionId === ext.id}
                                                            style={{
                                                                padding: "4px 10px", borderRadius: "8px",
                                                                border: "1px solid #e2e8f0", background: "#f8fafc",
                                                                color: "#475569", fontSize: "0.75rem", fontWeight: 600,
                                                                cursor: "pointer", display: "inline-flex",
                                                                alignItems: "center", gap: "4px"
                                                            }}
                                                        >
                                                            {resendingExtensionId === ext.id ? (
                                                                <span className="spinner-border spinner-border-sm"></span>
                                                            ) : (
                                                                <><i className="bi bi-envelope"></i> Resend Email</>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>
                                                    ₹{parseFloat(ext.amount).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );

                                const SectionHeader = ({ icon, title, count, color }) => (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        marginBottom: "14px", marginTop: "8px"
                                    }}>
                                        <div style={{
                                            width: "32px", height: "32px", borderRadius: "8px",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: color + "18", color: color
                                        }}>
                                            <i className={`bi ${icon}`} style={{ fontSize: "0.95rem" }}></i>
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "#1e293b" }}>{title}</h4>
                                        <span style={{
                                            padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                                            background: color + "18", color: color
                                        }}>
                                            {count}
                                        </span>
                                    </div>
                                );

                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {unpaid.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-clock-fill" title="Awaiting Payment" count={unpaid.length} color="#d97706" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                                                    {unpaid.map(ext => <ExtensionCard key={ext.id} ext={ext} isPaid={false} />)}
                                                </div>
                                            </>
                                        )}

                                        {paid.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-check-circle-fill" title="Paid" count={paid.length} color="#059669" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {paid.map(ext => <ExtensionCard key={ext.id} ext={ext} isPaid={true} />)}
                                                </div>
                                            </>
                                        )}

                                        {expired.length > 0 && (
                                            <>
                                                <SectionHeader icon="bi-x-circle-fill" title="Expired / Cancelled" count={expired.length} color="#dc2626" />
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {expired.map(ext => <ExtensionCard key={ext.id} ext={ext} isPaid={false} isExpired={true} />)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}

                </>
            )}

            {/* ==================== TODAY'S ACTIVITY TAB ==================== */}
            {activeTab === "today" && (
                <>
                    <div className="events-filters">
                        <div className="status-filter">
                            <select
                                value={bookingsKennelFilter}
                                onChange={(e) => setBookingsKennelFilter(e.target.value)}
                            >
                                <option value="all">All Kennels</option>
                                {kennels.map(k => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="search-box" style={{ maxWidth: "220px" }}>
                            <i className="bi bi-calendar-day"></i>
                            <input
                                type="date"
                                value={todayDate}
                                onChange={(e) => setTodayDate(e.target.value)}
                                style={{ paddingLeft: "38px" }}
                            />
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => fetchAllBookings(true)}
                            disabled={loadingBookings}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loadingBookings ? 'spinning' : ''}`}></i>
                        </button>
                    </div>

                    {loadingBookings ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* Check-ins Section */}
                            <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <div style={{
                                    padding: "16px 20px",
                                    background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                                    borderBottom: "1px solid #a7f3d0",
                                    display: "flex", alignItems: "center", gap: "10px"
                                }}>
                                    <i className="bi bi-box-arrow-in-right" style={{ fontSize: "1.2rem", color: "#059669" }}></i>
                                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#065f46" }}>
                                        Check-ins ({todayCheckIns.length})
                                    </h4>
                                </div>
                                {todayCheckIns.length === 0 ? (
                                    <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                        <i className="bi bi-calendar-x" style={{ fontSize: "2rem", display: "block", marginBottom: "8px", opacity: 0.5 }}></i>
                                        <p style={{ margin: 0 }}>No check-ins for this date</p>
                                    </div>
                                ) : (
                                    <div style={{ padding: "12px" }}>
                                        {todayCheckIns.map(b => (
                                            <div key={b.booking_id} style={{
                                                display: "flex", alignItems: "center", gap: "16px",
                                                padding: "14px 16px", borderRadius: "10px",
                                                border: "1px solid #e2e8f0", marginBottom: "8px",
                                                background: "#fafafa"
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                                                        {b.first_name} {b.last_name}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                        <i className="bi bi-telephone me-1"></i>{b.phone_number}
                                                        <span style={{ margin: "0 8px" }}>·</span>
                                                        <i className="bi bi-door-open me-1"></i>{b.room_type_name || "N/A"}
                                                        {kennels.length > 1 && (
                                                            <><span style={{ margin: "0 8px" }}>·</span><i className="bi bi-house-door me-1"></i>{b.kennel_name}</>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                                        {b.pets?.map((p, i) => (
                                                            <span key={i} style={{
                                                                display: "inline-block", padding: "2px 8px",
                                                                background: p.pet_aggression === "high" ? "#fef2f2" : p.pet_aggression === "moderate" ? "#fffbeb" : "#f0fdf4",
                                                                color: p.pet_aggression === "high" ? "#dc2626" : p.pet_aggression === "moderate" ? "#d97706" : "#16a34a",
                                                                borderRadius: "12px", fontSize: "0.75rem", marginRight: "6px",
                                                                fontWeight: 500
                                                            }}>
                                                                {p.pet_name} ({p.pet_breed}) · {p.pet_aggression}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{b.total_price}</span>
                                                    <span style={{
                                                        padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600,
                                                        background: b.status === "completed" ? "#d1fae5" : (b.status === "cancelled" || b.status === "no_show") ? "#fee2e2" : b.status === "checked_in" ? "#dbeafe" : "#e0e7ff",
                                                        color: b.status === "completed" ? "#059669" : (b.status === "cancelled" || b.status === "no_show") ? "#dc2626" : b.status === "checked_in" ? "#2563eb" : "#4f46e5"
                                                    }}>
                                                        {b.status === "checked_in" ? "Checked In" : b.status === "no_show" ? "No Show" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Check-outs Section */}
                            <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <div style={{
                                    padding: "16px 20px",
                                    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                                    borderBottom: "1px solid #fcd34d",
                                    display: "flex", alignItems: "center", gap: "10px"
                                }}>
                                    <i className="bi bi-box-arrow-right" style={{ fontSize: "1.2rem", color: "#b45309" }}></i>
                                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#78350f" }}>
                                        Check-outs ({todayCheckOuts.length})
                                    </h4>
                                </div>
                                {todayCheckOuts.length === 0 ? (
                                    <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                        <i className="bi bi-calendar-x" style={{ fontSize: "2rem", display: "block", marginBottom: "8px", opacity: 0.5 }}></i>
                                        <p style={{ margin: 0 }}>No check-outs for this date</p>
                                    </div>
                                ) : (
                                    <div style={{ padding: "12px" }}>
                                        {todayCheckOuts.map(b => (
                                            <div key={b.booking_id} style={{
                                                display: "flex", alignItems: "center", gap: "16px",
                                                padding: "14px 16px", borderRadius: "10px",
                                                border: "1px solid #e2e8f0", marginBottom: "8px",
                                                background: "#fafafa"
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                                                        {b.first_name} {b.last_name}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                        <i className="bi bi-telephone me-1"></i>{b.phone_number}
                                                        <span style={{ margin: "0 8px" }}>·</span>
                                                        <i className="bi bi-door-open me-1"></i>{b.room_type_name || "N/A"}
                                                        {kennels.length > 1 && (
                                                            <><span style={{ margin: "0 8px" }}>·</span><i className="bi bi-house-door me-1"></i>{b.kennel_name}</>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                                        {b.pets?.map((p, i) => (
                                                            <span key={i} style={{
                                                                display: "inline-block", padding: "2px 8px",
                                                                background: p.pet_aggression === "high" ? "#fef2f2" : p.pet_aggression === "moderate" ? "#fffbeb" : "#f0fdf4",
                                                                color: p.pet_aggression === "high" ? "#dc2626" : p.pet_aggression === "moderate" ? "#d97706" : "#16a34a",
                                                                borderRadius: "12px", fontSize: "0.75rem", marginRight: "6px",
                                                                fontWeight: 500
                                                            }}>
                                                                {p.pet_name} ({p.pet_breed}) · {p.pet_aggression}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{b.total_price}</span>
                                                    <span style={{
                                                        padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600,
                                                        background: b.status === "completed" ? "#d1fae5" : (b.status === "cancelled" || b.status === "no_show") ? "#fee2e2" : b.status === "checked_in" ? "#dbeafe" : "#e0e7ff",
                                                        color: b.status === "completed" ? "#059669" : (b.status === "cancelled" || b.status === "no_show") ? "#dc2626" : b.status === "checked_in" ? "#2563eb" : "#4f46e5"
                                                    }}>
                                                        {b.status === "checked_in" ? "Checked In" : b.status === "no_show" ? "No Show" : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ==================== OCCUPANCY TAB ==================== */}
            {activeTab === "occupancy" && (
                <>
                    <div className="manage-events-submenu" style={{ marginBottom: "16px" }}>
                        <button
                            className={`submenu-item ${occupancyView === "summary" ? "active" : ""}`}
                            onClick={() => setOccupancyView("summary")}
                        >
                            <i className="bi bi-bar-chart"></i>
                            Summary
                        </button>
                        <button
                            className={`submenu-item ${occupancyView === "rooms" ? "active" : ""}`}
                            onClick={() => setOccupancyView("rooms")}
                        >
                            <i className="bi bi-grid-3x3"></i>
                            Room View
                        </button>
                        <button
                            className={`submenu-item ${occupancyView === "calendar" ? "active" : ""}`}
                            onClick={() => setOccupancyView("calendar")}
                        >
                            <i className="bi bi-calendar3"></i>
                            Calendar
                        </button>
                    </div>

                    {occupancyView !== "calendar" && (
                        <div className="events-filters">
                            {kennels.length > 1 && (
                                <div className="status-filter">
                                    <select
                                        value={occupancyKennelId}
                                        onChange={(e) => setOccupancyKennelId(e.target.value)}
                                    >
                                        {kennels.map(k => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="search-box" style={{ maxWidth: "180px" }}>
                                <i className="bi bi-calendar"></i>
                                <input
                                    type="date"
                                    value={occupancyDate}
                                    onChange={(e) => setOccupancyDate(e.target.value)}
                                    style={{ paddingLeft: "38px" }}
                                />
                            </div>
                            <button
                                className="earnings-refresh-btn"
                                onClick={() => { fetchOccupancy(); if (occupancyView === "rooms") fetchRoomOccupancy(true); }}
                                disabled={loadingOccupancy || loadingRoomOccupancy}
                                style={{ marginLeft: "auto", minWidth: "unset" }}
                            >
                                <i className={`bi bi-arrow-clockwise ${(loadingOccupancy || loadingRoomOccupancy) ? 'spinning' : ''}`}></i>
                            </button>
                        </div>
                    )}

                    {/* ---- SUMMARY VIEW ---- */}
                    {occupancyView === "summary" && (
                        <>
                            {loadingOccupancy ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : !occupancyData ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : occupancyData.room_types?.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bi bi-door-open"></i>
                                    <p>No room types configured for this kennel</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {occupancyData.room_types.map((rt, idx) => {
                                        const nextDay = getNextDay(occupancyDate);
                                        const totalRooms = parseInt(rt.available_rooms) + (allBookings.filter(b =>
                                            b.kennel_id === parseInt(occupancyKennelId) &&
                                            b.room_type_name === rt.room_type &&
                                            (b.status === "booked" || b.status === "checked_in") &&
                                            new Date(b.check_in_date) < new Date(nextDay) &&
                                            new Date(b.check_out_date) > new Date(occupancyDate)
                                        ).length || 0);
                                        const occupied = totalRooms - parseInt(rt.available_rooms);
                                        const percentage = totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;
                                        return (
                                            <div key={idx} style={{
                                                background: "white", borderRadius: "12px", padding: "20px",
                                                border: "1px solid #e2e8f0"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                                                            {rt.room_type}
                                                        </h4>
                                                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                            S: ₹{rt.price_small} · M: ₹{rt.price_medium} · L: ₹{rt.price_large}
                                                        </span>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span style={{
                                                            fontSize: "1.4rem", fontWeight: 700,
                                                            color: percentage >= 90 ? "#dc2626" : percentage >= 70 ? "#d97706" : "#059669"
                                                        }}>
                                                            {rt.available_rooms}
                                                        </span>
                                                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}> / {totalRooms} available</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    height: "10px", background: "#f1f5f9", borderRadius: "5px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        height: "100%", borderRadius: "5px", transition: "width 0.5s ease",
                                                        width: `${percentage}%`,
                                                        background: percentage >= 90 ? "linear-gradient(90deg, #ef4444, #dc2626)" :
                                                            percentage >= 70 ? "linear-gradient(90deg, #f59e0b, #d97706)" :
                                                                "linear-gradient(90deg, #10b981, #059669)"
                                                    }}></div>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.75rem", color: "#94a3b8" }}>
                                                    <span>{occupied} occupied</span>
                                                    <span>{Math.round(percentage)}% full</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ---- ROOM VIEW ---- */}
                    {occupancyView === "rooms" && (
                        <>
                            {loadingRoomOccupancy ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : roomOccupancy.length === 0 ? (
                                <div className="loading-spinner">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    {/* Legend */}
                                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.8rem", color: "#64748b" }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", border: "1px solid #6ee7b7" }}></span>
                                            Available
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1px solid #fcd34d" }}></span>
                                            Booked
                                        </span>
                                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "linear-gradient(135deg, #fee2e2, #fecaca)", border: "1px solid #fca5a5" }}></span>
                                            Checked In
                                        </span>
                                    </div>

                                    {/* Group by room type */}
                                    {(() => {
                                        const grouped = {};
                                        roomOccupancy.forEach(r => {
                                            if (!grouped[r.room_type_name]) grouped[r.room_type_name] = [];
                                            grouped[r.room_type_name].push(r);
                                        });
                                        return Object.entries(grouped).map(([typeName, rooms]) => {
                                            const occupiedCount = rooms.filter(r => r.is_occupied).length;
                                            return (
                                                <div key={typeName}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>{typeName}</h4>
                                                        <span style={{
                                                            padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                                                            background: occupiedCount === rooms.length ? "#fee2e2" : occupiedCount === 0 ? "#d1fae5" : "#fef3c7",
                                                            color: occupiedCount === rooms.length ? "#dc2626" : occupiedCount === 0 ? "#059669" : "#d97706"
                                                        }}>
                                                            {occupiedCount}/{rooms.length} occupied
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                                                        {rooms.map(room => {
                                                            const bookingStatus = room.booking?.status;
                                                            const isCheckedIn = room.is_occupied && bookingStatus === "checked_in";
                                                            const isBooked = room.is_occupied && bookingStatus === "booked";
                                                            return (
                                                                <div
                                                                    key={`${room.room_type_id}-${room.display_number}`}
                                                                    onClick={() => room.is_occupied && setSelectedRoom(room)}
                                                                    style={{
                                                                        borderRadius: "12px",
                                                                        border: isCheckedIn ? "1px solid #fca5a5" : isBooked ? "1px solid #fcd34d" : "1px solid #6ee7b7",
                                                                        background: isCheckedIn
                                                                            ? "linear-gradient(135deg, #fff5f5, #fee2e2)"
                                                                            : isBooked
                                                                                ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
                                                                                : "linear-gradient(135deg, #f0fdf4, #d1fae5)",
                                                                        padding: "16px",
                                                                        transition: "all 0.2s",
                                                                        cursor: room.is_occupied ? "pointer" : "default"
                                                                    }}
                                                                >
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                            <i className={`bi ${isCheckedIn ? "bi-door-closed-fill" : isBooked ? "bi-door-closed" : "bi-door-open"}`}
                                                                                style={{ fontSize: "1.1rem", color: isCheckedIn ? "#dc2626" : isBooked ? "#d97706" : "#059669" }}></i>
                                                                            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>
                                                                                Room {room.display_number}
                                                                            </span>
                                                                        </div>
                                                                        <span style={{
                                                                            padding: "2px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 600,
                                                                            background: isCheckedIn ? "#dc2626" : isBooked ? "#d97706" : "#059669",
                                                                            color: "white"
                                                                        }}>
                                                                            {isCheckedIn ? "Checked In" : isBooked ? "Booked" : "Free"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </>
                    )}

                    {/* ---- CALENDAR VIEW ---- */}
                    {occupancyView === "calendar" && (
                        <>
                            <div className="events-filters">
                                {kennels.length > 1 && (
                                    <div className="status-filter">
                                        <select
                                            value={calendarKennelId}
                                            onChange={(e) => setCalendarKennelId(e.target.value)}
                                        >
                                            {kennels.map(k => (
                                                <option key={k.id} value={k.id}>{k.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "8px", padding: "3px" }}>
                                    <button
                                        onClick={() => setCalendarMode("month")}
                                        style={{
                                            padding: "4px 14px", borderRadius: "6px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                            background: calendarMode === "month" ? "white" : "transparent",
                                            color: calendarMode === "month" ? "#1e293b" : "#64748b",
                                            boxShadow: calendarMode === "month" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                                        }}
                                    >Month</button>
                                    <button
                                        onClick={() => setCalendarMode("year")}
                                        style={{
                                            padding: "4px 14px", borderRadius: "6px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                            background: calendarMode === "year" ? "white" : "transparent",
                                            color: calendarMode === "year" ? "#1e293b" : "#64748b",
                                            boxShadow: calendarMode === "year" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                                        }}
                                    >Year</button>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                                    <button onClick={() => {
                                        if (calendarMode === "month") {
                                            const prev = calendarMonth === 0 ? 11 : calendarMonth - 1;
                                            setCalendarMonth(prev);
                                            if (prev === 11) setCalendarYear(y => y - 1);
                                        } else { setCalendarYear(y => y - 1); }
                                    }} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", minWidth: "140px", textAlign: "center" }}>
                                        {calendarMode === "month"
                                            ? `${["January","February","March","April","May","June","July","August","September","October","November","December"][calendarMonth]} ${calendarYear}`
                                            : calendarYear}
                                    </span>
                                    <button onClick={() => {
                                        if (calendarMode === "month") {
                                            const next = calendarMonth === 11 ? 0 : calendarMonth + 1;
                                            setCalendarMonth(next);
                                            if (next === 0) setCalendarYear(y => y + 1);
                                        } else { setCalendarYear(y => y + 1); }
                                    }} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569" }}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                    <button onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }}
                                        style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", color: "#475569" }}>
                                        Today
                                    </button>
                                </div>
                            </div>

                            {loadingBookings ? (
                                <div className="loading-spinner"><div className="spinner-border" role="status"></div></div>
                            ) : (() => {
                                const selectedKennel = kennels.find(k => String(k.id) === String(calendarKennelId));
                                const totalRooms = selectedKennel ? parseInt(selectedKennel.total_rooms) || 0 : 0;
                                const kennelBookings = allBookings.filter(b =>
                                    b.kennel_id === parseInt(calendarKennelId) &&
                                    (b.status === "booked" || b.status === "checked_in")
                                );
                                const kennelClosures = closures.filter(c => c.kennel_id === parseInt(calendarKennelId));

                                const getDayData = (dateStr) => {
                                    const d = new Date(dateStr);
                                    const nextDay = new Date(d); nextDay.setDate(nextDay.getDate() + 1);
                                    const occupied = kennelBookings.reduce((sum, b) => {
                                        const ci = new Date(b.check_in_date);
                                        const co = new Date(b.check_out_date);
                                        if (ci < nextDay && co > d) return sum + (b.pets?.length || 1);
                                        return sum;
                                    }, 0);
                                    const isClosed = kennelClosures.some(c => {
                                        const cs = new Date(c.closure_start);
                                        const ce = new Date(c.closure_end);
                                        return cs <= d && ce >= d;
                                    });
                                    return { occupied, isClosed };
                                };

                                const getColor = (occupied, total, isClosed) => {
                                    if (isClosed) return { bg: "#fef2f2", border: "#fca5a5", pattern: true };
                                    if (total === 0 || occupied === 0) return { bg: "#f1f5f9", border: "#e2e8f0", pattern: false };
                                    const pct = occupied / total;
                                    if (pct <= 0.25) return { bg: "#dcfce7", border: "#86efac", pattern: false };
                                    if (pct <= 0.5) return { bg: "#bbf7d0", border: "#4ade80", pattern: false };
                                    if (pct <= 0.75) return { bg: "#86efac", border: "#22c55e", pattern: false };
                                    return { bg: "#22c55e", border: "#16a34a", pattern: false };
                                };

                                const todayStr = new Date().toISOString().split("T")[0];
                                const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

                                const renderMonth = (month, year, compact = false) => {
                                    const firstDay = new Date(year, month, 1);
                                    const lastDay = new Date(year, month + 1, 0);
                                    const startPad = (firstDay.getDay() + 6) % 7;
                                    const cells = [];
                                    for (let i = 0; i < startPad; i++) cells.push(null);
                                    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

                                    const cellSize = compact ? "18px" : "44px";
                                    const fontSize = compact ? "0.55rem" : "0.8rem";
                                    const gap = compact ? "3px" : "4px";

                                    return (
                                        <div>
                                            {!compact && (
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap, marginBottom: "4px" }}>
                                                    {dayNames.map(dn => (
                                                        <div key={dn} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8" }}>{dn}</div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap }}>
                                                {cells.map((day, i) => {
                                                    if (day === null) return <div key={`pad-${i}`} style={{ width: cellSize, height: cellSize }}></div>;
                                                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                                    const { occupied, isClosed } = getDayData(dateStr);
                                                    const color = getColor(occupied, totalRooms, isClosed);
                                                    const isToday = dateStr === todayStr;
                                                    const pct = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

                                                    return (
                                                        <div
                                                            key={dateStr}
                                                            onMouseEnter={(e) => {
                                                                if (compact) return;
                                                                e.currentTarget.style.transform = "scale(1.1)";
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setCalTooltip({
                                                                    show: true,
                                                                    x: rect.left + rect.width / 2,
                                                                    y: rect.top - 8,
                                                                    text: isClosed
                                                                        ? `Closed for maintenance`
                                                                        : `${occupied}/${totalRooms} occupied (${pct}%)`,
                                                                    dateLabel: `${day} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month]} ${year}`,
                                                                    isClosed
                                                                });
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = "scale(1)";
                                                                setCalTooltip(t => ({ ...t, show: false }));
                                                            }}
                                                            onClick={() => {
                                                                if (!isClosed) {
                                                                    setOccupancyDate(dateStr);
                                                                    setOccupancyKennelId(calendarKennelId);
                                                                    setOccupancyView("summary");
                                                                }
                                                            }}
                                                            style={{
                                                                width: cellSize, height: cellSize,
                                                                borderRadius: compact ? "3px" : "8px",
                                                                background: isClosed
                                                                    ? "repeating-linear-gradient(135deg, #fef2f2, #fef2f2 3px, #fecaca 3px, #fecaca 6px)"
                                                                    : color.bg,
                                                                border: isToday ? "2px solid #1e293b" : `1px solid ${color.border}`,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize, fontWeight: isToday ? 700 : 500,
                                                                color: isClosed ? "#dc2626" : (occupied > 0 && totalRooms > 0 && occupied / totalRooms > 0.5) ? "#fff" : "#374151",
                                                                cursor: isClosed ? "default" : "pointer",
                                                                transition: "transform 0.15s",
                                                                position: "relative"
                                                            }}
                                                        >
                                                            {compact ? "" : day}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                };

                                return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        {totalRooms === 0 ? (
                                            <div className="empty-state">
                                                <i className="bi bi-door-open"></i>
                                                <p>No rooms configured for this kennel</p>
                                            </div>
                                        ) : calendarMode === "month" ? (
                                            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                                                {renderMonth(calendarMonth, calendarYear, false)}
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                                gap: "16px"
                                            }}>
                                                {Array.from({ length: 12 }, (_, m) => (
                                                    <div key={m} style={{
                                                        background: "white", borderRadius: "12px", padding: "12px",
                                                        border: m === new Date().getMonth() && calendarYear === new Date().getFullYear() ? "2px solid #1e293b" : "1px solid #e2e8f0",
                                                        cursor: "pointer"
                                                    }}
                                                        onClick={() => { setCalendarMonth(m); setCalendarMode("month"); }}
                                                    >
                                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", textAlign: "center" }}>
                                                            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m]}
                                                        </div>
                                                        {renderMonth(m, calendarYear, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Legend */}
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
                                            padding: "12px 16px", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0"
                                        }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>Occupancy:</span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#f1f5f9", border: "1px solid #e2e8f0" }}></span>0%
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#dcfce7", border: "1px solid #86efac" }}></span>1-25%
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#bbf7d0", border: "1px solid #4ade80" }}></span>26-50%
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#86efac", border: "1px solid #22c55e" }}></span>51-75%
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#22c55e", border: "1px solid #16a34a" }}></span>76-100%
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b", marginLeft: "8px" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "repeating-linear-gradient(135deg, #fef2f2, #fef2f2 3px, #fecaca 3px, #fecaca 6px)", border: "1px solid #fca5a5" }}></span>Closed
                                            </span>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#64748b", marginLeft: "8px" }}>
                                                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "white", border: "2px solid #1e293b" }}></span>Today
                                            </span>
                                        </div>

                                        {/* Custom Tooltip */}
                                        {calTooltip.show && (
                                            <div style={{
                                                position: "fixed",
                                                left: calTooltip.x,
                                                top: calTooltip.y,
                                                transform: "translate(-50%, -100%)",
                                                background: "#1e293b",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "8px",
                                                fontSize: "0.75rem",
                                                whiteSpace: "nowrap",
                                                pointerEvents: "none",
                                                zIndex: 9999,
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "2px"
                                            }}>
                                                <span style={{ fontWeight: 700 }}>{calTooltip.dateLabel}</span>
                                                <span style={{ color: calTooltip.isClosed ? "#fca5a5" : "#86efac" }}>{calTooltip.text}</span>
                                                <div style={{
                                                    position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)",
                                                    width: 0, height: 0,
                                                    borderLeft: "5px solid transparent",
                                                    borderRight: "5px solid transparent",
                                                    borderTop: "5px solid #1e293b"
                                                }}></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </>
            )}

            {/* ==================== EMPLOYEES TAB ==================== */}
            {activeTab === "employees" && loadingKennels && (
                <div className="loading-spinner">
                    <div className="spinner-border" role="status"></div>
                </div>
            )}
            {activeTab === "employees" && !loadingKennels && !permissions.isOwner && (
                <div className="empty-state">
                    <i className="bi bi-shield-lock"></i>
                    <p>Only kennel owners can manage employees</p>
                </div>
            )}
            {activeTab === "employees" && !loadingKennels && permissions.isOwner && (
                <>
                    <div className="events-filters">
                        {kennels.filter(k => k.user_role === "owner").length > 1 && (
                            <div className="status-filter">
                                <select
                                    value={employeesKennelId}
                                    onChange={(e) => setEmployeesKennelId(e.target.value)}
                                >
                                    {kennels.filter(k => k.user_role === "owner").map(k => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={employeesSearch}
                                onChange={(e) => setEmployeesSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => {
                                if (!showAddEmployee) {
                                    setShowAddEmployee(true);
                                    if (employeeUsers.length === 0) fetchEmployeeUsers();
                                } else {
                                    setShowAddEmployee(false);
                                }
                            }}
                            style={{ marginLeft: "auto" }}
                        >
                            <i className={`bi ${showAddEmployee ? 'bi-x-lg' : 'bi-person-plus'}`}></i>
                            {showAddEmployee ? " Cancel" : " Add Employee"}
                        </button>
                    </div>

                    {/* Add Employee Form */}
                    {showAddEmployee && (
                        <div style={{
                            background: "white", borderRadius: "12px", padding: "20px",
                            border: "1px solid #e2e8f0", marginBottom: "20px"
                        }}>
                            <h4 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Add Employee</h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>User *</label>
                                    {loadingEmployeeUsers ? (
                                        <div className="manual-entry-loading"><div className="spinner-border spinner-border-sm"></div></div>
                                    ) : (
                                        <select
                                            value={newEmployee.user_id}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, user_id: e.target.value })}
                                            className="manual-entry-select"
                                        >
                                            <option value="">Choose a user...</option>
                                            {employeeUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "10px" }}>Permissions</label>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <label style={{
                                            display: "flex", alignItems: "center", gap: "10px",
                                            fontSize: "0.9rem", color: "#94a3b8"
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={true}
                                                disabled
                                                style={{ width: "18px", height: "18px", accentColor: "#1e293b" }}
                                            />
                                            <i className="bi bi-house-door" style={{ color: "#94a3b8" }}></i>
                                            Basic Access (My Kennels, Today's Activity, Occupancy, Support Tickets)
                                        </label>
                                        {[
                                            { key: "can_manage_bookings", label: "Manage Bookings (Bookings, Manual Booking)", icon: "bi-calendar-check" },
                                            { key: "can_manage_kennel", label: "Manage Kennel (Profile, Revenue, Maintenance Closure)", icon: "bi-gear" }
                                        ].map(perm => (
                                            <label key={perm.key} style={{
                                                display: "flex", alignItems: "center", gap: "10px",
                                                cursor: "pointer", fontSize: "0.9rem", color: "#334155"
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newEmployee[perm.key]}
                                                    onChange={(e) => setNewEmployee({ ...newEmployee, [perm.key]: e.target.checked })}
                                                    style={{ width: "18px", height: "18px", accentColor: "#1e293b" }}
                                                />
                                                <i className={`bi ${perm.icon}`} style={{ color: "#64748b" }}></i>
                                                {perm.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    className="manual-entry-submit"
                                    onClick={handleAddEmployee}
                                    disabled={submittingEmployee || !newEmployee.user_id}
                                    style={{ marginTop: "4px" }}
                                >
                                    {submittingEmployee ? (
                                        <><span className="spinner-border spinner-border-sm"></span> Adding...</>
                                    ) : (
                                        <><i className="bi bi-person-plus"></i> Add Employee</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Employee List */}
                    {loadingEmployees ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : employees.filter(emp => {
                        if (!employeesSearch.trim()) return true;
                        const s = employeesSearch.toLowerCase();
                        return (
                            emp.first_name?.toLowerCase().includes(s) ||
                            emp.last_name?.toLowerCase().includes(s) ||
                            emp.email?.toLowerCase().includes(s) ||
                            emp.phone_number?.includes(s)
                        );
                    }).length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-person-badge"></i>
                            <p>No employees added yet</p>
                        </div>
                    ) : (
                        <div className="registrations-table-wrapper">
                            <table className="registrations-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Bookings</th>
                                        <th>Kennel</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.filter(emp => {
                                        if (!employeesSearch.trim()) return true;
                                        const s = employeesSearch.toLowerCase();
                                        return (
                                            emp.first_name?.toLowerCase().includes(s) ||
                                            emp.last_name?.toLowerCase().includes(s) ||
                                            emp.email?.toLowerCase().includes(s) ||
                                            emp.phone_number?.includes(s)
                                        );
                                    }).map(emp => (
                                        <tr key={emp.id}>
                                            <td>{emp.first_name} {emp.last_name}</td>
                                            <td>{emp.email}</td>
                                            <td>{emp.phone_number}</td>
                                            <td><i className={`bi ${emp.can_manage_bookings ? 'bi-check-circle-fill' : 'bi-x-circle'}`} style={{ color: emp.can_manage_bookings ? "#059669" : "#dc2626" }}></i></td>
                                            <td><i className={`bi ${emp.can_manage_kennel ? 'bi-check-circle-fill' : 'bi-x-circle'}`} style={{ color: emp.can_manage_kennel ? "#059669" : "#dc2626" }}></i></td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemoveEmployee(emp.id)}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: "6px", border: "1px solid #fecaca",
                                                        background: "#fef2f2", color: "#dc2626", fontSize: "0.8rem",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ==================== MAINTENANCE CLOSURE TAB ==================== */}
            {activeTab === "closure" && loadingKennels && (
                <div className="loading-spinner">
                    <div className="spinner-border" role="status"></div>
                </div>
            )}
            {activeTab === "closure" && !loadingKennels && !(permissions.isOwner || permissions.canManageKennel) && (
                <div className="empty-state">
                    <i className="bi bi-shield-lock"></i>
                    <p>You don't have access to manage maintenance closures</p>
                </div>
            )}
            {activeTab === "closure" && !loadingKennels && (permissions.isOwner || permissions.canManageKennel) && (
                <>
                    {/* Warning */}
                    <div style={{
                        padding: "16px 20px", borderRadius: "10px", marginBottom: "20px",
                        background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
                        border: "1px solid #fca5a5"
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: "1.3rem", color: "#dc2626", marginTop: "2px" }}></i>
                            <div>
                                <h4 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 600, color: "#991b1b" }}>
                                    Scheduling a Maintenance Closure
                                </h4>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c", lineHeight: 1.5 }}>
                                    During a maintenance closure, no new bookings (online or offline) will be accepted for the kennel.
                                    Existing bookings during the closure period must be cancelled manually before scheduling.
                                    The kennel will not appear in search results and no revenue will be generated during this period.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Form */}
                    <div style={{
                        background: "white", borderRadius: "12px", padding: "24px",
                        border: "1px solid #e2e8f0", marginBottom: "24px"
                    }}>
                        <h4 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                            Schedule New Closure
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Kennel</label>
                                {profileKennels.length === 1 ? (
                                    (() => {
                                        if (!closureKennelId) setClosureKennelId(profileKennels[0].id);
                                        return (
                                            <div className="manual-entry-select" style={{ background: "#f8fafc", cursor: "default" }}>
                                                {profileKennels[0].name}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <select
                                        value={closureKennelId}
                                        onChange={(e) => setClosureKennelId(e.target.value)}
                                        className="manual-entry-select"
                                    >
                                        {profileKennels.map(k => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: "180px" }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={closureStart}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => {
                                            setClosureStart(e.target.value);
                                            setConflictingBookings([]);
                                            if (closureEnd && e.target.value >= closureEnd) setClosureEnd("");
                                        }}
                                        className="manual-entry-select"
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: "180px" }}>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>End Date</label>
                                    <input
                                        type="date"
                                        value={closureEnd}
                                        min={closureStart || new Date().toISOString().split("T")[0]}
                                        onChange={(e) => { setClosureEnd(e.target.value); setConflictingBookings([]); }}
                                        className="manual-entry-select"
                                        disabled={!closureStart}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Reason (optional)</label>
                                <input
                                    type="text"
                                    value={closureReason}
                                    onChange={(e) => setClosureReason(e.target.value)}
                                    placeholder="e.g. Maintenance, Renovation, Deep Cleaning"
                                    className="manual-entry-select"
                                />
                            </div>

                            {/* Conflicting Bookings Warning */}
                            {conflictingBookings.length > 0 && (
                                <div style={{
                                    padding: "16px", borderRadius: "10px",
                                    background: "#fef2f2", border: "1px solid #fecaca"
                                }}>
                                    <div style={{ fontWeight: 600, color: "#dc2626", fontSize: "0.9rem", marginBottom: "10px" }}>
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {conflictingBookings.length} booking{conflictingBookings.length !== 1 ? "s" : ""} found during this period:
                                    </div>
                                    {conflictingBookings.map((b, idx) => (
                                        <div key={idx} style={{
                                            padding: "10px 12px", background: "white", borderRadius: "8px",
                                            marginBottom: "6px", fontSize: "0.85rem", color: "#1e293b",
                                            display: "flex", justifyContent: "space-between", alignItems: "center"
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: 600 }}>#{b.booking_id}</span>
                                                <span style={{ margin: "0 8px", color: "#94a3b8" }}>·</span>
                                                {b.guest}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                <i className="bi bi-telephone me-1"></i>{b.phone}
                                                <span style={{ margin: "0 8px" }}>·</span>
                                                {formatDate(b.check_in)} → {formatDate(b.check_out)}
                                            </div>
                                        </div>
                                    ))}
                                    <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "#b91c1c" }}>
                                        Please contact these customers to cancel their bookings before scheduling the closure.
                                    </p>
                                </div>
                            )}

                            <button
                                className="manual-entry-submit"
                                onClick={handleCreateClosure}
                                disabled={submittingClosure || !closureStart || !closureEnd}
                                style={{
                                    alignSelf: "flex-start",
                                    background: "linear-gradient(135deg, #dc2626, #b91c1c)"
                                }}
                            >
                                {submittingClosure ? (
                                    <><span className="spinner-border spinner-border-sm"></span> Scheduling...</>
                                ) : (
                                    <><i className="bi bi-exclamation-triangle"></i> Schedule Closure</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Existing Closures */}
                    <div style={{
                        background: "white", borderRadius: "12px",
                        border: "1px solid #e2e8f0", overflow: "hidden"
                    }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                                Scheduled Closures
                            </h4>
                        </div>
                        {loadingClosures ? (
                            <div className="loading-spinner">
                                <div className="spinner-border" role="status"></div>
                            </div>
                        ) : closures.filter(c => {
                            if (profileKennels.length > 0) {
                                const ids = new Set(profileKennels.map(k => k.id));
                                return ids.has(c.kennel_id);
                            }
                            return true;
                        }).length === 0 ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                <i className="bi bi-calendar-check" style={{ fontSize: "2rem", display: "block", marginBottom: "8px", opacity: 0.5 }}></i>
                                <p style={{ margin: 0 }}>No upcoming closures scheduled</p>
                            </div>
                        ) : (
                            <div style={{ padding: "12px" }}>
                                {closures.filter(c => {
                                    if (profileKennels.length > 0) {
                                        const ids = new Set(profileKennels.map(k => k.id));
                                        return ids.has(c.kennel_id);
                                    }
                                    return true;
                                }).map(c => {
                                    const today = new Date().toISOString().split("T")[0];
                                    const isActive = today >= c.closure_start && today < c.closure_end;
                                    return (
                                        <div key={c.id} style={{
                                            display: "flex", alignItems: "center", gap: "16px",
                                            padding: "14px 16px", borderRadius: "10px",
                                            border: isActive ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                                            background: isActive ? "#fff5f5" : "#fafafa",
                                            marginBottom: "8px"
                                        }}>
                                            <div style={{
                                                width: "40px", height: "40px", borderRadius: "10px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                background: isActive ? "#fee2e2" : "#fef3c7",
                                                flexShrink: 0
                                            }}>
                                                <i className={`bi ${isActive ? "bi-x-circle-fill" : "bi-clock-fill"}`}
                                                    style={{ color: isActive ? "#dc2626" : "#d97706", fontSize: "1.1rem" }}></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                                                    {c.kennel_name}
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                    {formatDate(c.closure_start)} → {formatDate(c.closure_end)}
                                                    {c.reason && <span style={{ margin: "0 8px" }}>·</span>}
                                                    {c.reason && <span>{c.reason}</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                                                    background: isActive ? "#fee2e2" : "#fef3c7",
                                                    color: isActive ? "#dc2626" : "#d97706"
                                                }}>
                                                    {isActive ? "Active" : "Upcoming"}
                                                </span>
                                                <button
                                                    onClick={() => handleCancelClosure(c.id)}
                                                    disabled={cancellingClosureId === c.id}
                                                    style={{
                                                        padding: "6px 12px", borderRadius: "8px",
                                                        border: "1px solid #fecaca", background: "#fef2f2",
                                                        color: "#dc2626", fontSize: "0.8rem", cursor: "pointer"
                                                    }}
                                                >
                                                    {cancellingClosureId === c.id ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <><i className="bi bi-x-lg me-1"></i>Cancel</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ==================== KENNEL INFO MODAL ==================== */}
            {showKennelModal && (
                <div className="event-modal-overlay" onClick={() => { setShowKennelModal(false); setKennelInfo(null); }}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="event-modal-header">
                            <h3>Kennel Details</h3>
                            <button onClick={() => { setShowKennelModal(false); setKennelInfo(null); }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            {kennelInfo ? (
                                <>
                                    {/* Images */}
                                    {kennelInfo.images?.length > 0 && (
                                        <div className="modal-event-images">
                                            {kennelInfo.images.map((img, idx) => (
                                                <img key={idx} src={img.image_url} alt={img.alt_text || kennelInfo.name} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Basic Info */}
                                    <div className="modal-section">
                                        <h4>{kennelInfo.name}</h4>
                                        <span className={`status-badge ${kennelInfo.is_active ? 'upcoming' : 'past'}`}>
                                            {kennelInfo.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {/* Address & Details */}
                                    <div className="modal-section info-grid">
                                        <div className="info-item">
                                            <i className="bi bi-geo-alt"></i>
                                            <span>{kennelInfo.street_address_1}{kennelInfo.street_address_2 ? `, ${kennelInfo.street_address_2}` : ""}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-pin-map"></i>
                                            <span>{kennelInfo.city}, {kennelInfo.state} - {kennelInfo.pin_code}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-percent"></i>
                                            <span>Markup: {kennelInfo.markup}%</span>
                                        </div>
                                        {kennelInfo.owner && (
                                            <div className="info-item">
                                                <i className="bi bi-person"></i>
                                                <span>Owner: {kennelInfo.owner.first_name} {kennelInfo.owner.last_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Features */}
                                    {kennelInfo.features?.length > 0 && (
                                        <div className="modal-section">
                                            <h5>Features</h5>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                {kennelInfo.features.map((f, idx) => (
                                                    <span key={idx} style={{
                                                        padding: "4px 12px",
                                                        background: "#f1f5f9",
                                                        borderRadius: "20px",
                                                        fontSize: "0.8rem",
                                                        color: "#475569"
                                                    }}>
                                                        {f.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rooms */}
                                    {kennelInfo.rooms?.length > 0 && (
                                        <div className="modal-section">
                                            <h5>Room Types</h5>
                                            <div className="pricing-list">
                                                {kennelInfo.rooms.map((room, idx) => (
                                                    <div key={idx} className="pricing-item">
                                                        <span className="tier-label">{room.room_type_name}</span>
                                                        <span className="tier-price">{room.count} rooms</span>
                                                        <span className="tier-sold">
                                                            S: ₹{room.price_small} · M: ₹{room.price_medium} · L: ₹{room.price_large}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action: View Bookings */}
                                    {permissions.canManageBookings && (
                                        <div className="modal-actions">
                                            <button
                                                className="btn-view-registrations"
                                                onClick={() => {
                                                    setShowKennelModal(false);
                                                    setKennelInfo(null);
                                                    setBookingsKennelFilter(String(kennelInfo.id));
                                                    setBookingsSearch("");
                                                    setBookingsStatusFilter("all");
                                                    setBookingsModeFilter("all");
                                                    navigate("/admin/kennels-admin/bookings");
                                                    fetchAllBookings(true);
                                                }}
                                            >
                                                <i className="bi bi-calendar-check"></i>
                                                View Bookings
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="modal-loading">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Pending Payments Modal */}
            {showCheckoutModal && checkoutBooking && (
                <div className="event-modal-overlay" onClick={() => setShowCheckoutModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
                        <div className="event-modal-header">
                            <h3>Pending Payments</h3>
                            <button onClick={() => setShowCheckoutModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            {/* Booking info */}
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{checkoutBooking.booking_id} · {checkoutBooking.first_name} {checkoutBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {checkoutBooking.kennel_name} · {checkoutBooking.phone_number}
                                </div>
                            </div>

                            {/* All paid state */}
                            {!checkoutPending && (
                                <div style={{
                                    padding: "20px", borderRadius: "10px",
                                    background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "20px",
                                    textAlign: "center"
                                }}>
                                    <i className="bi bi-check-circle-fill" style={{ fontSize: "2rem", color: "#059669", display: "block", marginBottom: "8px" }}></i>
                                    <div style={{ fontWeight: 600, color: "#065f46", fontSize: "1rem", marginBottom: "4px" }}>All Payments Received!</div>
                                    <div style={{ fontSize: "0.85rem", color: "#059669" }}>You can now complete the checkout.</div>
                                </div>
                            )}

                            {checkoutPending && (
                                <>
                                    {/* Warning */}
                                    <div style={{
                                        padding: "14px 16px", borderRadius: "10px",
                                        background: "#fffbeb", border: "1px solid #fde68a", marginBottom: "20px"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                            <i className="bi bi-exclamation-triangle-fill" style={{ color: "#d97706", fontSize: "1.1rem", marginTop: "1px" }}></i>
                                            <div style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.5 }}>
                                                This booking has {checkoutPending.pending_extensions.length} pending extension payment{checkoutPending.pending_extensions.length !== 1 ? "s" : ""}. You can resend reminders or proceed with checkout anyway.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Online pending */}
                            {checkoutPending && checkoutPending.online_pending_total > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px"
                                    }}>
                                        <i className="bi bi-globe" style={{ color: "#2563eb" }}></i>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>Online Payments Pending</span>
                                        <span style={{
                                            marginLeft: "auto", fontWeight: 700, color: "#2563eb", fontSize: "1rem"
                                        }}>₹{checkoutPending.online_pending_total.toFixed(2)}</span>
                                    </div>
                                    {checkoutPending.pending_extensions.filter(e => e.payment_mode === "online").map((ext) => (
                                        <div key={ext.id} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "10px 14px", borderRadius: "8px",
                                            background: "#eff6ff", border: "1px solid #dbeafe", marginBottom: "8px"
                                        }}>
                                            <div>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#1e293b" }}>
                                                    +{ext.extra_days} night{ext.extra_days !== 1 ? "s" : ""} · ₹{ext.amount.toFixed(2)}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                    {formatDate(ext.original_checkout)} → {formatDate(ext.new_checkout)}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {ext.link_url && (
                                                    <button
                                                        onClick={() => handleResendCheckoutEmail(ext)}
                                                        disabled={resendingCheckoutId === ext.id}
                                                        style={{
                                                            padding: "5px 12px", borderRadius: "8px",
                                                            border: "1px solid #dbeafe", background: "white",
                                                            color: "#2563eb", fontSize: "0.75rem", fontWeight: 600,
                                                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                            whiteSpace: "nowrap"
                                                        }}
                                                    >
                                                        {resendingCheckoutId === ext.id ? (
                                                            <span className="spinner-border spinner-border-sm"></span>
                                                        ) : (
                                                            <><i className="bi bi-envelope"></i> Resend</>
                                                        )}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={async () => {
                                                        setRefreshingCheckout(true);
                                                        const response = await callServicesApi({
                                                            action: "GET_BOOKING_EXTENSIONS",
                                                            session_id,
                                                            booking_id: checkoutBooking.booking_id
                                                        });
                                                        if (response?.success) {
                                                            const pending = (response.extensions || []).filter(e => e.payment_status === "pending");
                                                            if (pending.length === 0) {
                                                                setCheckoutPending(null);
                                                                setSuccessMsg("All payments received!");
                                                            } else {
                                                                const online = pending.filter(e => e.payment_mode === "online");
                                                                const offline = pending.filter(e => e.payment_mode === "offline");
                                                                setCheckoutPending({
                                                                    ...checkoutPending,
                                                                    pending_extensions: pending.map(p => ({
                                                                        id: p.id,
                                                                        amount: parseFloat(p.amount),
                                                                        payment_mode: p.payment_mode,
                                                                        extra_days: p.extra_days,
                                                                        link_url: p.link_url,
                                                                        original_checkout: p.original_checkout_date,
                                                                        new_checkout: p.new_checkout_date
                                                                    })),
                                                                    online_pending_total: online.reduce((s, e) => s + parseFloat(e.amount), 0),
                                                                    offline_pending_total: offline.reduce((s, e) => s + parseFloat(e.amount), 0)
                                                                });
                                                            }
                                                        }
                                                        setRefreshingCheckout(false);
                                                    }}
                                                    disabled={refreshingCheckout}
                                                    style={{
                                                        padding: "5px 10px", borderRadius: "8px",
                                                        border: "1px solid #e2e8f0", background: "white",
                                                        color: "#475569", fontSize: "0.75rem", fontWeight: 600,
                                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {refreshingCheckout ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <i className="bi bi-arrow-clockwise"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Offline pending */}
                            {checkoutPending && checkoutPending.offline_pending_total > 0 && (
                                <div style={{ marginBottom: "20px" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px"
                                    }}>
                                        <i className="bi bi-shop" style={{ color: "#d97706" }}></i>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>Collect at Checkout</span>
                                        <span style={{
                                            marginLeft: "auto", fontWeight: 700, color: "#d97706", fontSize: "1rem"
                                        }}>₹{checkoutPending.offline_pending_total.toFixed(2)}</span>
                                    </div>
                                    <div style={{
                                        padding: "14px 16px", borderRadius: "10px",
                                        background: "#fffbeb", border: "1px solid #fde68a"
                                    }}>
                                        <div style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 500 }}>
                                            Please collect ₹{checkoutPending.offline_pending_total.toFixed(2)} from the customer before completing checkout.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={() => setShowCheckoutModal(false)}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", background: "white",
                                        color: "#475569", fontSize: "0.9rem", fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleForceCheckout}
                                    disabled={forcingCheckout}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "none", background: "linear-gradient(135deg, #059669, #047857)",
                                        color: "white", fontSize: "0.9rem", fontWeight: 600,
                                        cursor: "pointer", display: "flex", alignItems: "center",
                                        justifyContent: "center", gap: "6px"
                                    }}
                                >
                                    {forcingCheckout ? (
                                        <><span className="spinner-border spinner-border-sm"></span> Checking out...</>
                                    ) : (
                                        <><i className="bi bi-check-lg"></i> Complete Checkout</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-In Modal */}
            {showCheckInModal && checkInBooking && (
                <div className="event-modal-overlay" onClick={() => setShowCheckInModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                        <div className="event-modal-header">
                            <h3>Check In</h3>
                            <button onClick={() => setShowCheckInModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{checkInBooking.booking_id} · {checkInBooking.first_name} {checkInBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {checkInBooking.kennel_name} · {checkInBooking.pets?.map(p => p.pet_name).join(", ")}
                                </div>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                    Check-in Note <span style={{ color: "#94a3b8" }}>(optional)</span>
                                </label>
                                <textarea
                                    value={checkInNote}
                                    onChange={(e) => setCheckInNote(e.target.value)}
                                    placeholder="e.g. Pet seemed anxious, owner requested extra blanket..."
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", fontSize: "0.88rem", resize: "vertical",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={() => setShowCheckInModal(false)}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", background: "white",
                                        color: "#475569", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCheckInWithNote}
                                    disabled={submittingCheckIn}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                        color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                    }}
                                >
                                    {submittingCheckIn ? (
                                        <><span className="spinner-border spinner-border-sm"></span> Checking in...</>
                                    ) : (
                                        <><i className="bi bi-box-arrow-in-right"></i> Check In</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal (during stay) */}
            {showNotesModal && notesBooking && (
                <div className="event-modal-overlay" onClick={() => setShowNotesModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="event-modal-header">
                            <h3>Booking Notes</h3>
                            <button onClick={() => setShowNotesModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{notesBooking.booking_id} · {notesBooking.first_name} {notesBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {notesBooking.kennel_name} · {notesBooking.pets?.map(p => p.pet_name).join(", ")}
                                </div>
                            </div>

                            {/* Timeline */}
                            {loadingNotes ? (
                                <div style={{ textAlign: "center", padding: "20px" }}>
                                    <div className="spinner-border spinner-border-sm"></div>
                                </div>
                            ) : bookingNotes.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "0.88rem" }}>
                                    <i className="bi bi-journal" style={{ fontSize: "1.5rem", display: "block", marginBottom: "8px", opacity: 0.5 }}></i>
                                    No notes yet
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", maxHeight: "300px", overflowY: "auto" }}>
                                    {bookingNotes.map(note => (
                                        <div key={note.id} style={{
                                            padding: "12px 14px", borderRadius: "10px",
                                            background: note.note_type === "check_in" ? "#eff6ff" : note.note_type === "check_out" ? "#f0fdf4" : "#f8fafc",
                                            border: `1px solid ${note.note_type === "check_in" ? "#dbeafe" : note.note_type === "check_out" ? "#bbf7d0" : "#e2e8f0"}`
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                <span style={{
                                                    fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                                                    color: note.note_type === "check_in" ? "#2563eb" : note.note_type === "check_out" ? "#059669" : "#64748b"
                                                }}>
                                                    {note.note_type === "check_in" ? "Check-in" : note.note_type === "check_out" ? "Check-out" : "During Stay"}
                                                </span>
                                                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                                    {new Date(note.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "0.88rem", color: "#1e293b", lineHeight: 1.5 }}>{note.note}</div>
                                            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px" }}>
                                                — {note.first_name} {note.last_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add note */}
                            <div style={{ display: "flex", gap: "8px" }}>
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Add a note..."
                                    rows={2}
                                    style={{
                                        flex: 1, padding: "10px 14px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", fontSize: "0.88rem", resize: "none",
                                        fontFamily: "inherit"
                                    }}
                                />
                                <button
                                    onClick={() => handleAddNote(notesBooking.booking_id)}
                                    disabled={submittingNote || !newNote.trim()}
                                    style={{
                                        padding: "10px 16px", borderRadius: "10px",
                                        border: "none", background: "#1e293b", color: "white",
                                        fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                                        alignSelf: "flex-end", whiteSpace: "nowrap"
                                    }}
                                >
                                    {submittingNote ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <i className="bi bi-send"></i>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Notes Modal */}
            {showCheckoutNotesModal && checkoutNotesBooking && (
                <div className="event-modal-overlay" onClick={() => setShowCheckoutNotesModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="event-modal-header">
                            <h3>Check Out</h3>
                            <button onClick={() => setShowCheckoutNotesModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{checkoutNotesBooking.booking_id} · {checkoutNotesBooking.first_name} {checkoutNotesBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {checkoutNotesBooking.kennel_name} · {checkoutNotesBooking.pets?.map(p => p.pet_name).join(", ")}
                                </div>
                            </div>

                            {/* Previous notes timeline */}
                            {loadingCheckoutNotes ? (
                                <div style={{ textAlign: "center", padding: "20px" }}>
                                    <div className="spinner-border spinner-border-sm"></div>
                                </div>
                            ) : checkoutNotes.length > 0 && (
                                <div style={{ marginBottom: "20px" }}>
                                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", marginBottom: "10px" }}>
                                        <i className="bi bi-journal-text me-2"></i>Stay Notes ({checkoutNotes.length})
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto" }}>
                                        {checkoutNotes.map(note => (
                                            <div key={note.id} style={{
                                                padding: "10px 14px", borderRadius: "8px",
                                                background: note.note_type === "check_in" ? "#eff6ff" : note.note_type === "check_out" ? "#f0fdf4" : "#f8fafc",
                                                border: `1px solid ${note.note_type === "check_in" ? "#dbeafe" : note.note_type === "check_out" ? "#bbf7d0" : "#e2e8f0"}`
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                    <span style={{
                                                        fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
                                                        color: note.note_type === "check_in" ? "#2563eb" : note.note_type === "check_out" ? "#059669" : "#64748b"
                                                    }}>
                                                        {note.note_type === "check_in" ? "Check-in" : note.note_type === "check_out" ? "Check-out" : "During Stay"}
                                                    </span>
                                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                                        {new Date(note.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: 1.5 }}>{note.note}</div>
                                                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>— {note.first_name} {note.last_name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Checkout note */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                    Check-out Note <span style={{ color: "#94a3b8" }}>(optional)</span>
                                </label>
                                <textarea
                                    value={checkoutNote}
                                    onChange={(e) => setCheckoutNote(e.target.value)}
                                    placeholder="e.g. Pet was playful and healthy, no issues during stay..."
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", fontSize: "0.88rem", resize: "vertical",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={() => setShowCheckoutNotesModal(false)}
                                    disabled={processingCheckout}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "1px solid #e2e8f0", background: "white",
                                        color: "#475569", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceedCheckout}
                                    disabled={processingCheckout}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "10px",
                                        border: "none", background: "linear-gradient(135deg, #059669, #047857)",
                                        color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                        opacity: processingCheckout ? 0.7 : 1
                                    }}
                                >
                                    {processingCheckout ? (
                                        <><span className="spinner-border spinner-border-sm"></span> Processing...</>
                                    ) : (
                                        <><i className="bi bi-check-lg"></i> Proceed to Checkout</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extend Booking Modal */}
            {showExtendModal && extendBooking && (
                <div className="event-modal-overlay" onClick={() => setShowExtendModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="event-modal-header">
                            <h3>Extend Booking</h3>
                            <button onClick={() => setShowExtendModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            {/* Booking Info */}
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{extendBooking.booking_id} · {extendBooking.first_name} {extendBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {extendBooking.kennel_name} · Current checkout: {formatDate(extendBooking.check_out_date)}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                    Payment mode: <span className={`mode-badge ${extendBooking.mode === 'online' ? 'mode-online' : 'mode-offline'}`}>{extendBooking.mode}</span>
                                </div>
                            </div>

                            {/* New Date */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>New Checkout Date *</label>
                                <input
                                    type="date"
                                    value={extendNewDate}
                                    min={(() => {
                                        const d = new Date(extendBooking.check_out_date);
                                        d.setDate(d.getDate() + 1);
                                        return d.toISOString().split("T")[0];
                                    })()}
                                    onChange={(e) => handleExtendDateChange(e.target.value)}
                                    className="manual-entry-select"
                                />
                            </div>

                            {/* Price */}
                            {extendNewDate && (
                                <>
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                            Extension Amount (₹)
                                            <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "8px" }}>
                                                Calculated: ₹{extendCalculatedAmount}
                                            </span>
                                        </label>
                                        <div style={{ position: "relative" }}>
                                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.9rem" }}>₹</span>
                                            <input
                                                type="number"
                                                value={extendAmount}
                                                onChange={(e) => setExtendAmount(e.target.value)}
                                                className="manual-entry-select"
                                                style={{ paddingLeft: "28px" }}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div style={{
                                        padding: "14px 16px", borderRadius: "10px",
                                        background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                                            <span>Extra days</span>
                                            <span style={{ fontWeight: 600 }}>
                                                {Math.ceil((new Date(extendNewDate) - new Date(extendBooking.check_out_date)) / (1000 * 60 * 60 * 24))} day(s)
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                                            <span>Extension amount</span>
                                            <span style={{ fontWeight: 600 }}>₹{parseFloat(extendAmount || 0).toFixed(2)}</span>
                                        </div>
                                        {extendBooking.mode === "online" && parseFloat(extendAmount) > 0 && (
                                            <div style={{
                                                marginTop: "8px", padding: "8px 10px", borderRadius: "8px",
                                                background: "#eff6ff", border: "1px solid #bfdbfe",
                                                fontSize: "0.8rem", color: "#1e40af"
                                            }}>
                                                <i className="bi bi-info-circle me-2"></i>
                                                A payment link will be sent to {extendBooking.email}
                                            </div>
                                        )}
                                        {extendBooking.mode === "offline" && parseFloat(extendAmount) > 0 && (
                                            <div style={{
                                                marginTop: "8px", padding: "8px 10px", borderRadius: "8px",
                                                background: "#fffbeb", border: "1px solid #fde68a",
                                                fontSize: "0.8rem", color: "#92400e"
                                            }}>
                                                <i className="bi bi-info-circle me-2"></i>
                                                Amount to be collected at checkout
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <button
                                className="manual-entry-submit"
                                onClick={handleSubmitExtension}
                                disabled={submittingExtend || !extendNewDate}
                            >
                                {submittingExtend ? (
                                    <><span className="spinner-border spinner-border-sm"></span> Extending...</>
                                ) : (
                                    <><i className="bi bi-calendar-plus"></i> Confirm Extension</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Room Detail Modal */}
            {selectedRoom && selectedRoom.booking && (
                <div className="event-modal-overlay" onClick={() => setSelectedRoom(null)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
                        <div className="event-modal-header">
                            <h3>
                                {selectedRoom.room_type_name} — Room {selectedRoom.display_number}
                                <span style={{
                                    marginLeft: "10px", padding: "2px 10px", borderRadius: "10px",
                                    fontSize: "0.7rem", fontWeight: 600, verticalAlign: "middle",
                                    background: selectedRoom.booking?.status === "checked_in" ? "#fee2e2" : "#fef3c7",
                                    color: selectedRoom.booking?.status === "checked_in" ? "#dc2626" : "#d97706"
                                }}>
                                    {selectedRoom.booking?.status === "checked_in" ? "Checked In" : "Booked"}
                                </span>
                            </h3>
                            <button onClick={() => setSelectedRoom(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            <div className="modal-section">
                                <h5>Pet Details</h5>
                                <div className="modal-details-grid">
                                    <div className="modal-detail">
                                        <span className="detail-label">Name</span>
                                        <span className="detail-value">{selectedRoom.booking.pet_name}</span>
                                    </div>
                                    <div className="modal-detail">
                                        <span className="detail-label">Breed</span>
                                        <span className="detail-value">{selectedRoom.booking.pet_breed}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-section">
                                <h5>Guest Details</h5>
                                <div className="modal-details-grid">
                                    <div className="modal-detail">
                                        <span className="detail-label">Name</span>
                                        <span className="detail-value">{selectedRoom.booking.guest_name}</span>
                                    </div>
                                    <div className="modal-detail">
                                        <span className="detail-label">Phone</span>
                                        <span className="detail-value">{selectedRoom.booking.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-section">
                                <h5>Stay Details</h5>
                                <div className="modal-details-grid">
                                    <div className="modal-detail">
                                        <span className="detail-label">Check-in</span>
                                        <span className="detail-value">{formatDate(selectedRoom.booking.check_in)}</span>
                                    </div>
                                    <div className="modal-detail">
                                        <span className="detail-label">Check-out</span>
                                        <span className="detail-value">{formatDate(selectedRoom.booking.check_out)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Cancel Booking Modal */}
            {showAdminCancelModal && adminCancelBooking && (
                <div className="event-modal-overlay" onClick={() => !adminCancelProcessing && setShowAdminCancelModal(false)}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
                        <div className="event-modal-header">
                            <h3>Cancel Booking</h3>
                            <button onClick={() => !adminCancelProcessing && setShowAdminCancelModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            {/* Booking info */}
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "16px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b", marginBottom: "4px" }}>
                                    #{adminCancelBooking.booking_id} · {adminCancelBooking.first_name} {adminCancelBooking.last_name}
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "3px" }}>
                                    <span><i className="bi bi-house-door me-2"></i>{adminCancelBooking.kennel_name}</span>
                                    <span><i className="bi bi-calendar me-2"></i>{formatDate(adminCancelBooking.check_in_date)} → {formatDate(adminCancelBooking.check_out_date)}</span>
                                    {adminCancelBooking.pets?.length > 0 && (
                                        <span><i className="bi bi-heart me-2"></i>{adminCancelBooking.pets.map(p => p.pet_name).join(", ")}</span>
                                    )}
                                </div>
                            </div>

                            {adminCancelLoading ? (
                                <div style={{ textAlign: "center", padding: "30px 0" }}>
                                    <div className="spinner-border spinner-border-sm"></div>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "10px" }}>Calculating refund...</p>
                                </div>
                            ) : adminCancelPreview ? (
                                <>
                                    {/* Time-based tier */}
                                    <div style={{
                                        padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
                                        background: adminCancelPreview.no_show ? "#1e293b" : adminCancelPreview.hours_before_checkin < 72 ? "#fef2f2" : "#f0fdf4",
                                        border: `1px solid ${adminCancelPreview.no_show ? "#1e293b" : adminCancelPreview.hours_before_checkin < 72 ? "#fecaca" : "#bbf7d0"}`,
                                        fontSize: "0.82rem",
                                        color: adminCancelPreview.no_show ? "#ffffff" : adminCancelPreview.hours_before_checkin < 72 ? "#dc2626" : "#059669"
                                    }}>
                                        <i className={`bi ${adminCancelPreview.no_show ? "bi-exclamation-octagon" : adminCancelPreview.hours_before_checkin < 72 ? "bi-exclamation-triangle" : "bi-clock"} me-2`}></i>
                                        {adminCancelPreview.no_show
                                            ? "No-show — check-in date has passed. No refund will be issued."
                                            : `${Math.round(adminCancelPreview.hours_before_checkin)} hours before check-in — ${adminCancelPreview.display_fee_percent}% cancellation fee`
                                        }
                                    </div>

                                    {/* Refund breakdown */}
                                    <div style={{
                                        background: "#f8fafc", borderRadius: "10px", padding: "16px",
                                        border: "1px solid #e2e8f0", marginBottom: "16px"
                                    }}>
                                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b", marginBottom: "10px" }}>
                                            Refund Breakdown
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                            <span>Booking Total</span>
                                            <span>₹{adminCancelPreview.total_price}</span>
                                        </div>
                                        {adminCancelPreview.wallet_portion > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#7c3aed", marginBottom: "4px" }}>
                                                <span>Wallet portion</span>
                                                <span>₹{adminCancelPreview.wallet_portion}</span>
                                            </div>
                                        )}
                                        {adminCancelPreview.online_portion > 0 && (
                                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#2563eb", marginBottom: "4px" }}>
                                                <span>Online portion</span>
                                                <span>₹{adminCancelPreview.online_portion}</span>
                                            </div>
                                        )}
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#dc2626", marginBottom: "6px" }}>
                                            <span>Cancellation Fee ({adminCancelPreview.display_fee_percent}%)</span>
                                            <span>−₹{adminCancelPreview.total_fee}</span>
                                        </div>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            fontSize: "0.95rem", fontWeight: 700, color: "#059669",
                                            paddingTop: "8px", borderTop: "1px dashed #e2e8f0"
                                        }}>
                                            <span>Customer Gets Back</span>
                                            <span>₹{adminCancelPreview.total_refund}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: "10px 14px", borderRadius: "8px",
                                        background: "#f5f3ff", border: "1px solid #e9d5ff", marginBottom: "20px",
                                        fontSize: "0.82rem", color: "#6b21a8"
                                    }}>
                                        <i className="bi bi-wallet2 me-2"></i>
                                        ₹{adminCancelPreview.total_refund} will be credited to the customer's Woof Wallet instantly.
                                    </div>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            onClick={() => { setShowAdminCancelModal(false); setAdminCancelBooking(null); setAdminCancelPreview(null); }}
                                            disabled={adminCancelProcessing}
                                            style={{
                                                flex: 1, padding: "12px", borderRadius: "10px",
                                                border: "1px solid #e2e8f0", background: "white",
                                                color: "#475569", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                                            }}
                                        >
                                            Keep Booking
                                        </button>
                                        <button
                                            onClick={confirmAdminCancel}
                                            disabled={adminCancelProcessing}
                                            style={{
                                                flex: 1, padding: "12px", borderRadius: "10px",
                                                border: "none", background: "#dc2626",
                                                color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                            }}
                                        >
                                            {adminCancelProcessing ? (
                                                <><span className="spinner-border spinner-border-sm"></span> Cancelling...</>
                                            ) : (
                                                <><i className="bi bi-x-circle"></i> Cancel & Refund</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px", color: "#dc2626" }}>
                                    <p>Failed to load refund details. Please try again.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <AddUserModal
                    session_id={session_id}
                    onClose={() => setShowAddUserModal(false)}
                    onUserCreated={async (userId) => {
                        setSuccessMsg("User created successfully.");
                        setShowAddUserModal(false);
                        if (userId) {
                            setLookingUpUser(true);
                            const response = await callServicesApi({
                                action: "LOOKUP_USER",
                                session_id,
                                user_id: userId
                            });
                            if (response?.success && response.user) {
                                setManualUser(response.user);
                                setManualUserQuery(response.user.email);
                                setUserLookupDone(true);
                                setUserNotFound(false);
                                fetchManualPets(userId);
                            }
                            setLookingUpUser(false);
                        }
                    }}
                />
            )}

            {/* Add Pet Modal */}
            {showAddPetModal && manualUser && (
                <AddPetModal
                    onClose={() => setShowAddPetModal(false)}
                    onSaved={() => {
                        setShowAddPetModal(false);
                        if (manualUser) fetchManualPets(manualUser.id);
                    }}
                    userId={manualUser.id}
                />
            )}
        </div>
    );
};

export default KennelsAdminPage;
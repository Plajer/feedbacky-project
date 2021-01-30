import {ReactComponent as UndrawNoData} from "assets/svg/undraw/no_data.svg";
import axios from "axios";
import {SvgNotice} from "components/commons/SvgNotice";
import CommentsBox from "components/idea/discussion/CommentsBox";
import AppContext from "context/AppContext";
import BoardContext from "context/BoardContext";
import IdeaContext from "context/IdeaContext";
import React, {useContext, useEffect, useRef, useState} from 'react';
import TextareaAutosize from 'react-autosize-textarea';
import {FaFrown} from "react-icons/fa";
import InfiniteScroll from "react-infinite-scroller";
import tinycolor from "tinycolor2";
import {UiClickableTip, UiLoadingSpinner, UiPrettyUsername} from "ui";
import {UiLoadableButton} from "ui/button";
import {UiDropdownElement, UiSelectableDropdown} from "ui/dropdown";
import {UiCol, UiRow} from "ui/grid";
import {UiAvatar} from "ui/image";
import {prepareFilterAndSortRequests, toastAwait, toastError, toastSuccess, toastWarning} from "utils/basic-utils";
import {popupSwal} from "utils/sweetalert-utils";

const DiscussionBox = () => {
    const {user, serviceData, onLocalPreferencesUpdate, getTheme} = useContext(AppContext);
    const {data, updateState: updateBoardState, onNotLoggedClick} = useContext(BoardContext);
    const {ideaData, updateState} = useContext(IdeaContext);
    //fakeLoader option added here for odd glitch when you type into the comment box fast enough before comments are loaded they won't load the first page
    const [comments, setComments] = useState({data: [], loaded: false, error: false, moreToLoad: true, page: 0});
    const [submitOpen, setSubmitOpen] = useState(false);
    const sorts = [
        {oldest: "Oldest"},
        {newest: "Newest"}
    ];
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            onLoadRequest(1, true);
        }
        // eslint-disable-next-line
    }, [user.localPreferences]);
    const onLoadRequest = (page, override) => {
        setComments({...comments, fakeLoader: true});
        return axios.get("/ideas/" + ideaData.id + "/comments?page=" + (page - 1) + prepareFilterAndSortRequests(user.localPreferences.comments)).then(res => {
            if (override) {
                setComments({...comments, data: res.data.data, loaded: true, fakeLoader: false, moreToLoad: res.data.pageMetadata.currentPage < res.data.pageMetadata.pages, page});
            } else {
                setComments({...comments, data: comments.data.concat(res.data.data), loaded: true, fakeLoader: false, moreToLoad: res.data.pageMetadata.currentPage < res.data.pageMetadata.pages, page});
            }
        }).catch(() => {setComments({...comments, loaded: true, error: true})});
    };
    const renderComments = () => {
        if (comments.error) {
            return <div className={"text-danger mt-2 mb-3"}><FaFrown/> Failed to load comments</div>
        }
        if(comments.fakeLoader) {
            return <UiRow centered className={"mt-5 pt-5"} key={comments.data.length}><UiLoadingSpinner color={getTheme().toHexString()}/></UiRow>
        }
        return <InfiniteScroll
            pageStart={0}
            initialLoad={true}
            loadMore={page => onLoadRequest(page)}
            hasMore={comments.moreToLoad}
            loader={<UiRow centered className={"mt-5 pt-5"} key={comments.data.length}><UiLoadingSpinner color={getTheme().toHexString()}/></UiRow>}>
            {comments.data.map(data =>
                <CommentsBox key={data.id} data={data} onCommentDelete={onCommentDelete} onCommentLike={onCommentLike}
                             onCommentUnlike={onCommentUnlike} onSuspend={onSuspend}/>
            )}
        </InfiniteScroll>
    };
    const renderNoDataImage = () => {
        if (comments.loaded && comments.data.length === 0) {
            if (!ideaData.open) {
                return <SvgNotice Component={UndrawNoData} title={"No comments here."}/>
            }
            return <SvgNotice Component={UndrawNoData} title={"No comments here."} description={"Maybe it's time to write one?"}/>
        }
        return <React.Fragment/>
    };
    const renderCommentBox = () => {
        if (!ideaData.open && !serviceData.closedIdeasCommenting) {
            return;
        }
        if (user.loggedIn) {
            return <UiCol xs={10} className={"d-inline-flex mb-2 px-0"} style={{wordBreak: "break-word"}}>
                <div className={"text-center mr-3 pt-2"}>
                    <UiAvatar roundedCircle size={30} user={user.data}/>
                    <br/>
                </div>
                <UiCol xs={12} className={"px-0"}>
                    <small style={{fontWeight: "bold"}}><UiPrettyUsername user={user.data}/></small>
                    <br/>
                    <TextareaAutosize className={"form-control mt-1"} id={"commentMessage"} rows={1} maxRows={5} placeholder={"Write a comment..."}
                                      style={{resize: "none", overflow: "hidden"}} onChange={onCommentBoxKeyUp}/>
                    {renderSubmitButton()}
                </UiCol>
            </UiCol>
        }
        return <UiCol xs={10} className={"d-inline-flex mb-2 px-0"} style={{wordBreak: "break-word"}}>
            <div className={"text-center mr-3 pt-2"}>
                <UiAvatar roundedCircle size={30} user={null}/>
                <br/>
            </div>
            <UiCol xs={12} className={"px-0"}>
                <small style={{fontWeight: "bold"}}>Anonymous</small>
                <br/>
                <TextareaAutosize className={"form-control mt-1"} id={"commentMessage"} rows={1} maxRows={5} placeholder={"Write a comment..."}
                                  style={{resize: "none", overflow: "hidden"}} onChange={onNotLoggedClick} onClick={e => {
                    e.target.blur();
                    onNotLoggedClick();
                }}/>
            </UiCol>
        </UiCol>
    };
    const renderSubmitButton = () => {
        if (!submitOpen) {
            return <React.Fragment/>
        }
        const moderator = data.moderators.find(mod => mod.userId === user.data.id);
        return <div className={"mt-2"}>
            <UiLoadableButton size={"sm"} className={"ml-0 mb-0"} style={{fontSize: "0.75em"}} onClick={() => onCommentSubmit(false)}>
                Submit
            </UiLoadableButton>

            {moderator && <React.Fragment>
                <UiLoadableButton color={tinycolor("#0080FF")} size={"sm"} className={"ml-2 mr-1 mb-0"} style={{fontSize: "0.75em"}} onClick={() => onCommentSubmit(true)}>
                    Submit Internal
                </UiLoadableButton>
                <div className="d-inline-flex align-top"><UiClickableTip id={"internalTip"} title={"Internal Comments"} description={"Comments visible only for moderators of the project, hidden from public view."}/></div>
            </React.Fragment>}
        </div>
    };
    const onCommentSubmit = (internal) => {
        const textarea = document.getElementById("commentMessage");
        const message = textarea.value;
        const type = internal ? "INTERNAL" : "PUBLIC";
        if (message.length < 10 || message.length > 500) {
            toastWarning("Message must be longer than 10 and shorter than 500 characters!");
            return Promise.resolve();
        }
        return axios.post("/comments/", {
            ideaId: ideaData.id,
            description: message,
            type,
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                toastError();
                return;
            }
            if (user.localPreferences.comments.sort === "newest") {
                const newData = comments.data;
                newData.unshift(res.data);
                setComments({...comments, data: newData});
            } else {
                setComments({...comments, data: [...comments.data, res.data]});
            }
            setSubmitOpen(false);
            document.getElementById("commentMessage").value = "";
            updateBoardState({...data, commentsAmount: ideaData.commentsAmount + 1});
        }).catch(err => {
            if (err.response.status === 400) {
                toastWarning(err.response.data.errors[0]);
                return;
            }
            toastError();
        })
    };
    const onCommentBoxKeyUp = (e) => {
        let chars = e.target.value.length;
        if (chars > 0 && !submitOpen) {
            setSubmitOpen(true);
        }
        if (chars <= 0 && submitOpen) {
            setSubmitOpen(false);
        }
    };
    const onSuspend = (commentData) => {
        popupSwal("warning", "Dangerous action", "Suspended users cannot post new ideas and upvote/downvote ideas unless unsuspended through board admin panel.",
            "Suspend", "#d33", willClose => {
                if (!willClose.value) {
                    return;
                }
                //todo finite suspension dates
                const date = new Date();
                const id = toastAwait("Pending suspension...");
                axios.post("/boards/" + data.discriminator + "/suspendedUsers", {
                    userId: commentData.user.id,
                    suspensionEndDate: (date.getFullYear() + 10) + "-" + (date.getMonth() + 1) + "-" + date.getDate()
                }).then(res => {
                    if (res.status !== 201) {
                        toastError("Failed to suspend the user.", id);
                        return;
                    }
                    toastSuccess("User suspended.", id);
                    updateState({suspendedUsers: data.suspendedUsers.concat(res.data)});
                }).catch(err => toastError(err.response.data.errors[0]));
            });
    };
    const onCommentDelete = (id) => {
        popupSwal("warning", "Dangerous action",
            "This action is <strong>irreversible</strong> and will delete this comment, please confirm your action.",
            "Delete Comment", "#d33", willClose => {
                if (!willClose.value) {
                    return;
                }
                axios.delete("/comments/" + id).then(res => {
                    if (res.status !== 204) {
                        toastError();
                        return;
                    }
                    setComments({...comments, data: comments.data.filter(item => item.id !== id)});
                    updateState({...ideaData, commentsAmount: ideaData.commentsAmount - 1});
                    toastSuccess("Comment permanently deleted.");
                }).catch(err => toastError(err.response.data.errors[0]))
            });
    };
    const onCommentLike = (data) => {
        if (!user.loggedIn) {
            onNotLoggedClick();
            return;
        }
        axios.post("/comments/" + data.id + "/likers", {}).then(res => {
            if (res.status !== 200) {
                toastWarning("Failed to like comment.");
                return;
            }
            setComments({
                ...comments, data: comments.data.map(comment => {
                        if (comment.id === data.id) {
                            comment.liked = true;
                            comment.likesAmount++;
                        }
                        return comment;
                    }
                )
            });
        });
    };
    const onCommentUnlike = (data) => {
        if (!user.loggedIn) {
            onNotLoggedClick();
            return;
        }
        axios.delete("/comments/" + data.id + "/likers").then(res => {
            if (res.status !== 204) {
                toastWarning("Failed to unlike comment.");
                return;
            }
            setComments({
                ...comments, data: comments.data.map(comment => {
                    if (comment.id === data.id) {
                        comment.liked = false;
                        comment.likesAmount--;
                    }
                    return comment;
                })
            });
        });
    };
    const sortCurrentValue = Object.values(sorts.find(obj => {
        return Object.keys(obj)[0] === (user.localPreferences.comments.sort || "oldest");
    }));
    const sortValues = sorts.map(val => {
        const key = Object.keys(val)[0];
        const value = Object.values(val)[0];
        return <UiDropdownElement key={key} onClick={() => onLocalPreferencesUpdate({...user.localPreferences, comments: {...user.localPreferences.comments, sort: key}})}>{value}</UiDropdownElement>
    });
    return <UiCol xs={12}>
        <div>
            <div className={"d-inline-block text-black-75 mr-1"}>Discussion ({ideaData.commentsAmount} comments)</div>
            <UiSelectableDropdown id={"sort"} className={"d-inline-block"} currentValue={sortCurrentValue} values={sortValues}/>
        </div>
        <UiCol xs={12} sm={10} md={6} className={"p-0 mb-1 mt-1"} id={"commentBox"}>
            {renderCommentBox()}
            {renderNoDataImage()}
        </UiCol>
        <UiCol xs={11} md={10} className={"px-0"} id={"commentContainer"}>
            {renderComments()}
        </UiCol>
    </UiCol>
};

export default DiscussionBox;
import React, {useContext} from 'react';
import {Col, Dropdown} from "react-bootstrap";
import AppContext from "context/app-context";
import {FaAngleDown} from "react-icons/all";

const BoardSearchBar = () => {
    const context = useContext(AppContext);
    const filters = [
        {opened: "Opened"},
        {closed: "Closed"},
        {all: "All"}
    ];
    const sorts = [
        {trending: "Trending"},
        {voters_desc: "Most Voted"},
        {voters_asc: "Least Voted"},
        {newest: "Newest"},
        {oldest: "Oldest"}
    ];
    return <Col sm={12} className="my-1 text-left">
        Filtering {" "}
        <Dropdown className="d-inline mr-1" style={{zIndex: 1}}>
            <Dropdown.Toggle id="filter" variant="" className="search-dropdown-bar btn btn-link text-dark move-top-1px">
                <span>{Object.values(filters.find(obj => {
                    return Object.keys(obj)[0] === (context.user.searchPreferences.filter || "opened")
                }))[0]}</span>
                <FaAngleDown/>
            </Dropdown.Toggle>
            <Dropdown.Menu alignRight>
                {filters.map(val => {
                    const key = Object.keys(val)[0];
                    const value = Object.values(val)[0];
                    return <Dropdown.Item key={key} onClick={() => context.onFilteringUpdate(key)}>{value}</Dropdown.Item>
                })}
            </Dropdown.Menu>
        </Dropdown>
        and Sorting {" "}
        <Dropdown className="d-inline" style={{zIndex: 1}}>
            <Dropdown.Toggle id="sort" variant="" className="search-dropdown-bar btn btn-link text-dark move-top-1px">
                <span>{Object.values(sorts.find(obj => {
                    return Object.keys(obj)[0] === (context.user.searchPreferences.sort || "trending")
                }))}</span>
                <FaAngleDown/>
            </Dropdown.Toggle>
            <Dropdown.Menu alignRight>
                {sorts.map(val => {
                    const key = Object.keys(val)[0];
                    const value = Object.values(val)[0];
                    return <Dropdown.Item key={key} onClick={() => context.onSortingUpdate(key)}>{value}</Dropdown.Item>
                })}
            </Dropdown.Menu>
        </Dropdown>
    </Col>
};

export default BoardSearchBar;

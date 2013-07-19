"""
    flask.ext.restless.helpers
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Helper functions for Flask-Restless.

    :copyright: 2012 Jeffrey Finkelstein <jeffrey.finkelstein@gmail.com>
    :license: GNU AGPLv3+ or BSD

"""
import datetime
import inspect
import uuid

from dateutil.parser import parse as parse_datetime
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.associationproxy import AssociationProxy
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import ColumnProperty
from sqlalchemy.orm import object_mapper
from sqlalchemy.orm import RelationshipProperty as RelProperty
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.orm.attributes import QueryableAttribute
from sqlalchemy.orm.exc import UnmappedInstanceError
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.util import class_mapper
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import _BinaryExpression
from sqlalchemy.sql.expression import ColumnElement

#: Names of attributes which should definitely not be considered relations when
#: dynamically computing a list of relations of a SQLAlchemy model.
RELATION_BLACKLIST = ('query', 'query_class', '_sa_class_manager',
                      '_decl_class_registry')


#: Names of columns which should definitely not be considered user columns to
#: be included in a dictionary representation of a model.
COLUMN_BLACKLIST = ('_sa_polymorphic_on', )

#: Types which should be considered columns of a model when iterating over all
#: attributes of a model class.
COLUMN_TYPES = (InstrumentedAttribute, hybrid_property)


def partition(l, condition):
    """Returns a pair of lists, the left one containing all elements of `l` for
    which `condition` is ``True`` and the right one containing all elements of
    `l` for which `condition` is ``False``.

    `condition` is a function that takes a single argument (each individual
    element of the list `l`) and returns either ``True`` or ``False``.

    """
    return filter(condition, l), filter(lambda x: not condition(x), l)


def unicode_keys_to_strings(dictionary):
    """Returns a new dictionary with the same mappings as `dictionary`, but
    with each of the keys coerced to a string (by calling :func:`str(key)`).

    This function is intended to be used for Python 2.5 compatibility when
    unpacking a dictionary to provide keyword arguments to a function or
    method. For example::

        >>> def func(a=1, b=2):
        ...     return a + b
        ...
        >>> d = {u'a': 10, u'b': 20}
        >>> func(**d)
        Traceback (most recent call last):
          File "<stdin>", line 1, in <module>
        TypeError: func() keywords must be strings
        >>> func(**unicode_keys_to_strings(d))
        30

    """
    return dict((str(k), v) for k, v in dictionary.iteritems())


def session_query(session, model):
    """Returns a SQLAlchemy query object for the specified `model`.

    If `model` has a ``query`` attribute already, that object will be returned.
    Otherwise a query will be created and returned based on `session`.

    """
    return model.query if hasattr(model, 'query') else session.query(model)


def upper_keys(d):
    """Returns a new dictionary with the keys of `d` converted to upper case
    and the values left unchanged.

    """
    return dict(zip((k.upper() for k in d.keys()), d.values()))


def get_columns(model):
    """Returns a dictionary-like object containing all the columns of the
    specified `model` class.

    This includes `hybrid attributes`_.

    .. _hybrid attributes: http://docs.sqlalchemy.org/en/latest/orm/extensions/hybrid.html

    """
    columns = {}
    for superclass in model.__mro__:
        for name, column in superclass.__dict__.iteritems():
            if isinstance(column, COLUMN_TYPES):
                columns[name] = column
    return columns


def get_relations(model):
    """Returns a list of relation names of `model` (as a list of strings)."""
    return [k for k in dir(model)
            if not (k.startswith('__') or k in RELATION_BLACKLIST)
            and get_related_model(model, k)]


def get_related_model(model, relationname):
    """Gets the class of the model to which `model` is related by the attribute
    whose name is `relationname`.

    """
    cols = model._sa_class_manager
    attr = getattr(model, relationname)
    if relationname in cols and isinstance(attr.property, RelProperty):
        return cols[relationname].property.mapper.class_
    if isinstance(attr, AssociationProxy):
        return get_related_association_proxy_model(attr)
    return None


def get_related_association_proxy_model(attr):
    """Returns the model class specified by the given SQLAlchemy relation
    attribute, or ``None`` if no such class can be inferred.

    `attr` must be a relation attribute corresponding to an association proxy.

    """
    prop = attr.remote_attr.property
    for attribute in ('mapper', 'parent'):
        if hasattr(prop, attribute):
            return getattr(prop, attribute).class_
    return None


def has_field(model, fieldname):
    """Returns ``True`` if the `model` has the specified field, and it is not
    a hybrid property.

    """
    return (hasattr(model, fieldname) and
            not isinstance(getattr(model, fieldname), _BinaryExpression))


def is_date_field(model, fieldname):
    """Returns ``True`` if and only if the field of `model` with the specified
    name corresponds to either a :class:`datetime.date` object or a
    :class:`datetime.datetime` object.

    """
    field = getattr(model, fieldname)
    if isinstance(field, ColumnElement):
        fieldtype = field.type
    else:
        if isinstance(field, AssociationProxy):
            field = field.remote_attr
        prop = field.property
        if isinstance(prop, RelProperty):
            return False
        fieldtype = prop.columns[0].type
    return isinstance(fieldtype, Date) or isinstance(fieldtype, DateTime)


def assign_attributes(model, **kwargs):
    """Assign all attributes from the supplied `kwargs` dictionary to the
    model. This does the same thing as the default declarative constructor,
    when provided a dictionary of attributes and values.

    """
    cls = type(model)
    for field, value in kwargs.iteritems():
        if not hasattr(cls, field):
            msg = '%s has no field named "%r"' % (cls.__name__, field)
            raise TypeError(msg)
        setattr(model, field, value)


def primary_key_names(model):
    """Returns all the primary keys for a model."""
    return [key for key, field in inspect.getmembers(model)
           if isinstance(field, QueryableAttribute)
           and isinstance(field.property, ColumnProperty)
           and field.property.columns[0].primary_key]


def primary_key_name(model_or_instance):
    """Returns the name of the primary key of the specified model or instance
    of a model, as a string.

    If `model_or_instance` specifies multiple primary keys and ``'id'`` is one
    of them, ``'id'`` is returned. If `model_or_instance` specifies multiple
    primary keys and ``'id'`` is not one of them, only the name of the first
    one in the list of primary keys is returned.

    """
    its_a_model = isinstance(model_or_instance, type)
    model = model_or_instance if its_a_model else model_or_instance.__class__
    pk_names = primary_key_names(model)
    return 'id' if 'id' in pk_names else pk_names[0]


def is_like_list(instance, relation):
    """Returns ``True`` if and only if the relation of `instance` whose name is
    `relation` is list-like.

    A relation may be like a list if, for example, it is a non-lazy one-to-many
    relation, or it is a dynamically loaded one-to-many.

    """
    if relation in instance._sa_class_manager:
        return instance._sa_class_manager[relation].property.uselist
    related_value = getattr(type(instance), relation, None)
    return isinstance(related_value, AssociationProxy)


def is_mapped_class(cls):
    try:
        class_mapper(cls)
        return True
    except:
        return False

# This code was adapted from :meth:`elixir.entity.Entity.to_dict` and
# http://stackoverflow.com/q/1958219/108197.
def to_dict(instance, deep=None, exclude=None, include=None,
            exclude_relations=None, include_relations=None,
            include_methods=None):
    """Returns a dictionary representing the fields of the specified `instance`
    of a SQLAlchemy model.

    The returned dictionary is suitable as an argument to
    :func:`flask.jsonify`; :class:`datetime.date` and :class:`uuid.UUID`
    objects are converted to string representations, so no special JSON encoder
    behavior is required.

    `deep` is a dictionary containing a mapping from a relation name (for a
    relation of `instance`) to either a list or a dictionary. This is a
    recursive structure which represents the `deep` argument when calling
    :func:`!_to_dict` on related instances. When an empty list is encountered,
    :func:`!_to_dict` returns a list of the string representations of the
    related instances.

    If either `include` or `exclude` is not ``None``, exactly one of them must
    be specified. If both are not ``None``, then this function will raise a
    :exc:`ValueError`. `exclude` must be a list of strings specifying the
    columns which will *not* be present in the returned dictionary
    representation of the object (in other words, it is a
    blacklist). Similarly, `include` specifies the only columns which will be
    present in the returned dictionary (in other words, it is a whitelist).

    .. note::

       If `include` is an iterable of length zero (like the empty tuple or the
       empty list), then the returned dictionary will be empty. If `include` is
       ``None``, then the returned dictionary will include all columns not
       excluded by `exclude`.

    `include_relations` is a dictionary mapping strings representing relation
    fields on the specified `instance` to a list of strings representing the
    names of fields on the related model which should be included in the
    returned dictionary; `exclude_relations` is similar.

    `include_methods` is a list mapping strings to method names which will
    be called and their return values added to the returned dictionary.

    """
    if (exclude is not None or exclude_relations is not None) and \
            (include is not None or include_relations is not None):
        raise ValueError('Cannot specify both include and exclude.')
    # create a list of names of columns, including hybrid properties
    try:
        columns = [p.key for p in object_mapper(instance).iterate_properties
                   if isinstance(p, ColumnProperty)]
    except UnmappedInstanceError:
        return instance
    for parent in type(instance).mro():
        columns += [key for key, value in parent.__dict__.iteritems()
                    if isinstance(value, hybrid_property)]
    # filter the columns based on exclude and include values
    if exclude is not None:
        columns = (c for c in columns if c not in exclude)
    elif include is not None:
        columns = (c for c in columns if c in include)
    # create a dictionary mapping column name to value
    result = dict((col, getattr(instance, col)) for col in columns
                  if not (col.startswith('__') or col in COLUMN_BLACKLIST))
    # add any included methods
    if include_methods is not None:
        result.update(dict((method, getattr(instance, method)())
                           for method in include_methods
                           if not '.' in method))
    # Check for objects in the dictionary that may not be serializable by
    # default. Specifically, convert datetime and date objects to ISO 8601
    # format, and convert UUID objects to hexadecimal strings.
    for key, value in result.items():
        # TODO We can get rid of this when issue #33 is resolved.
        if isinstance(value, datetime.date):
            result[key] = value.isoformat()
        elif isinstance(value, uuid.UUID):
            result[key] = str(value)
        elif is_mapped_class(type(value)):
            result[key] = to_dict(value)
    # recursively call _to_dict on each of the `deep` relations
    deep = deep or {}
    for relation, rdeep in deep.iteritems():
        # Get the related value so we can see if it is None, a list, a query
        # (as specified by a dynamic relationship loader), or an actual
        # instance of a model.
        relatedvalue = getattr(instance, relation)
        if relatedvalue is None:
            result[relation] = None
            continue
        # Determine the included and excluded fields for the related model.
        newexclude = None
        newinclude = None
        if exclude_relations is not None and relation in exclude_relations:
            newexclude = exclude_relations[relation]
        elif (include_relations is not None and
              relation in include_relations):
            newinclude = include_relations[relation]
        # Determine the included methods for the related model.
        newmethods = None
        if include_methods is not None:
            newmethods = [method.split('.', 1)[1] for method in include_methods
                        if method.split('.', 1)[0] == relation]
        if is_like_list(instance, relation):
            result[relation] = [to_dict(inst, rdeep, exclude=newexclude,
                                        include=newinclude,
                                        include_methods=newmethods)
                                for inst in relatedvalue]
            continue
        # If the related value is dynamically loaded, resolve the query to get
        # the single instance.
        if isinstance(relatedvalue, Query):
            relatedvalue = relatedvalue.one()
        result[relation] = to_dict(relatedvalue, rdeep, exclude=newexclude,
                                   include=newinclude,
                                   include_methods=newmethods)
    return result


def evaluate_functions(session, model, functions):
    """Executes each of the SQLAlchemy functions specified in ``functions``, a
    list of dictionaries of the form described below, on the given model and
    returns a dictionary mapping function name (slightly modified, see below)
    to result of evaluation of that function.

    `session` is the SQLAlchemy session in which all database transactions will
    be performed.

    `model` is the SQLAlchemy model class on which the specified functions will
    be evaluated.

    ``functions`` is a list of dictionaries of the form::

        {'name': 'avg', 'field': 'amount'}

    For example, if you want the sum and the average of the field named
    "amount"::

        >>> # assume instances of Person exist in the database...
        >>> f1 = dict(name='sum', field='amount')
        >>> f2 = dict(name='avg', field='amount')
        >>> evaluate_functions(Person, [f1, f2])
        {'avg__amount': 456, 'sum__amount': 123}

    The return value is a dictionary mapping ``'<funcname>__<fieldname>'`` to
    the result of evaluating that function on that field. If `model` is
    ``None`` or `functions` is empty, this function returns the empty
    dictionary.

    If a field does not exist on a given model, :exc:`AttributeError` is
    raised. If a function does not exist,
    :exc:`sqlalchemy.exc.OperationalError` is raised. The former exception will
    have a ``field`` attribute which is the name of the field which does not
    exist. The latter exception will have a ``function`` attribute which is the
    name of the function with does not exist.

    """
    if not model or not functions:
        return {}
    processed = []
    funcnames = []
    for function in functions:
        funcname, fieldname = function['name'], function['field']
        # We retrieve the function by name from the SQLAlchemy ``func``
        # module and the field by name from the model class.
        #
        # If the specified field doesn't exist, this raises AttributeError.
        funcobj = getattr(func, funcname)
        try:
            field = getattr(model, fieldname)
        except AttributeError, exception:
            exception.field = fieldname
            raise exception
        # Time to store things to be executed. The processed list stores
        # functions that will be executed in the database and funcnames
        # contains names of the entries that will be returned to the
        # caller.
        funcnames.append('%s__%s' % (funcname, fieldname))
        processed.append(funcobj(field))
    # Evaluate all the functions at once and get an iterable of results.
    try:
        evaluated = session.query(*processed).one()
    except OperationalError, exception:
        # HACK original error message is of the form:
        #
        #    '(OperationalError) no such function: bogusfuncname'
        original_error_msg = exception.args[0]
        bad_function = original_error_msg[37:]
        exception.function = bad_function
        raise exception
    return dict(zip(funcnames, evaluated))


def query_by_primary_key(session, model, primary_key_value):
    """Returns a SQLAlchemy query object containing the result of querying
    `model` for instances whose primary key has the value `primary_key_value`.

    Presumably, the returned query should have at most one element.

    """
    # force unicode primary key name to string; see unicode_keys_to_strings
    pk_name = str(primary_key_name(model))
    query = session_query(session, model)
    return query.filter_by(**{pk_name: primary_key_value})


def get_by(session, model, primary_key_value):
    """Returns the first instance of `model` whose primary key has the value
    `primary_key_value`, or ``None`` if no such instance exists.

    """
    return query_by_primary_key(session, model, primary_key_value).first()


def get_or_create(session, model, attrs):
    """Returns the single instance of `model` whose primary key has the
    value found in `attrs`, or initializes a new instance if no primary key
    is specified.

    Before returning the new or existing instance, its attributes are
    assigned to the values supplied in the `attrs` dictionary.

    This method does not commit the changes made to the session; the
    calling function has that responsibility.

    """
    # Not a full relation, probably just an association proxy to a scalar
    # attribute on the remote model.
    if not isinstance(attrs, dict):
        return attrs
    pk_names = primary_key_names(model)
    # If all of the primary keys were included in `attrs`, try to update
    # an existing row.
    if all(k in attrs for k in pk_names):
        # Determine the sub-dictionary of `attrs` which contains the mappings
        # for the primary keys.
        pk_values = dict((k, v) for (k, v) in attrs.iteritems()
                         if k in pk_names)
        # query for an existing row which matches all the specified
        # primary key values.
        instance = session_query(session, model).filter_by(**pk_values).first()
        if instance is not None:
            assign_attributes(instance, **attrs)
            return instance
    # If some of the primary keys were missing, or the row wasn't found,
    # create a new row.
    return model(**attrs)


def strings_to_dates(model, dictionary):
    """Returns a new dictionary with all the mappings of `dictionary` but
    with date strings mapped to :class:`datetime.datetime` objects.

    The keys of `dictionary` are names of fields in the model specified in the
    constructor of this class. The values are values to set on these fields. If
    a field name corresponds to a field in the model which is a
    :class:`sqlalchemy.types.Date` or :class:`sqlalchemy.types.DateTime`, then
    the returned dictionary will have the corresponding
    :class:`datetime.datetime` Python object as the value of that mapping in
    place of the string.

    This function outputs a new dictionary; it does not modify the argument.

    """
    result = {}
    for fieldname, value in dictionary.iteritems():
        if is_date_field(model, fieldname) and value is not None:
            if value.strip() == '':
                result[fieldname] = None
            elif value in ('CURRENT_TIMESTAMP', 'CURRENT_DATE', 'LOCALTIMESTAMP',):
                result[fieldname] = getattr(func, value.lower())()
            else:
                result[fieldname] = parse_datetime(value)
        else:
            result[fieldname] = value
    return result